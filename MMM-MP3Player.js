/* Magic Mirror Module: MMM-MP3Player
 * v1.0.1 - May 2018
 * By Asim Siddiqui <asimhsidd@gmail.com>
 *
 * 12-Aug-2020
 * Remade by Pavel Smelov.
 * MIT License
 */
var arrPlayed = [];
Module.register("MMM-MP3Player",{
	defaults: {
		musicPath: "modules/MMM-MP3Player/music/", 
		autoPlay: true,
		random: false,
		loopList: true,
	},
	getStyles: function() {
		return ["style.css"];
	},

	getDom: function() {
		var self = this;
		wrapper = document.createElement("div");
		wrapper.id = self.identifier + "_wrapper";
		player = document.createElement("div");
		player.className = "player";
		self.info = document.createElement("div");
		self.info.className = "info";
		self.artist = document.createElement("span");
		self.artist.className = "artist";
		self.artist.innerHTML = "MMM-MP3Player";
		self.song = document.createElement("span");
		self.song.className = "name";
		if (self.config.autoPlay){ self.song.innerHTML = "AutoPlay Enabled"; }
		else { self.song.innerHTML = "AutoPlay Disabled"; }
		if (self.config.random){ self.song.innerHTML = self.song.innerHTML + "<br />Random Enabled"; }
		else { self.song.innerHTML = self.song.innerHTML + "<br />Random Disabled"; }
		//self.song.innerHTML = "Searching mp3...";
		progress = document.createElement("div");
		progress.className = "progress-bar";
		self.bar = document.createElement("div");
		self.bar.className = "bar";
		progress.appendChild(self.bar);
		self.info.appendChild(self.artist);
		self.info.appendChild(self.song);
		self.info.appendChild(progress);
		self.album_art = document.createElement("div");
		self.album_art.className = "album-art";
		player.appendChild(self.album_art);
		player.appendChild(self.info);		
		audioElement = document.createElement("audio");
		audioElement.id = self.identifier+"_player";
		wrapper.appendChild(audioElement);
		wrapper.appendChild(player);
		setTimeout(function(){ self.sendSocketNotification("INITIATEDEVICES", self.config); }, 3000);
		return wrapper;
	},

	socketNotificationReceived: function(notification, payload){
		var self = this;
		switch(notification){
			case "Error": // Universal error handler
				self.musicFound = false;
				console.log("Error! Music may not be found.");
				break;
			case "Music_Files": // this populates the songs list (array)
				self.songs = payload;
				self.current = 0;
				self.musicFound = true;
				console.log("Music Found");
				arrPlayed = Array(self.songs.length).fill(false);
				if (self.config.autoPlay){
					if (self.config.random){
						ind = Math.floor(Math.random() * self.songs.length); //(self.current + 1) % self.songs.length;
						arrPlayed[ind] = true;
						self.current = ind;
					}
					self.sendSocketNotification("LOADFILE", self.songs[self.current]);
				}
				break;
			case "Music_File": // this is called everytime a song is sent from the server
				// create url of the raw data received and play it
				audioElement=document.getElementById(self.identifier+"_player");
				var binaryData = [];
				binaryData.push(payload[0]);
				if ((payload[2] = 'mp3') || (payload[2] = 'flac')){
					var url = window.URL.createObjectURL(new Blob(binaryData, {type: "audio/mpeg"}));
				}
				/*else if (payload[2] = 'ogg'){
					var url = window.URL.createObjectURL(new Blob(binaryData, {type: "audio/ogg"}));
				}*/
				else if (payload[2] = 'wav'){
					var url = window.URL.createObjectURL(new Blob(binaryData, {type: "audio/wav"}));
				}
				audioElement.load();
				audioElement.setAttribute('src', url);
				audioElement.volume = 1;
				audioElement.play();
				self.artist.innerHTML = payload[1][0];
				self.song.innerHTML = payload[1][1];
				self.album_art.classList.add('active');
				// progress bar (thanks to Michael Foley @ https://codepen.io/mdf/pen/ZWbvBv)
				var timer;
				var percent = 0;
				audioElement.addEventListener("playing", function(_event) {
					advance(_event.target.duration, audioElement);
				});
				audioElement.addEventListener("pause", function(_event) {
					clearTimeout(timer);
				});
				var advance = function(duration, element) {
					increment = 10/duration
					percent = Math.min(increment * element.currentTime * 10, 100);
					self.bar.style.width = percent+'%'
					startTimer(duration, element);
				}
				var startTimer = function(duration, element){ 
					if(percent < 100) {
						timer = setTimeout(function (){advance(duration, element)}, 100);
					}
				}
				// next track & loop
				audioElement.onended = function() {
					if(!self.musicFound){
						self.album_art.classList.toggle('active');
						return;
					}
					if (self.config.random){
						if (!arrPlayed.includes(false)){ // if all files are played
							if (!self.config.loopList) {
								self.artist.innerHTML = "Playlist ended";
								self.song.innerHTML = "";
								console.log("Playlist ended");
								return;
							}
							arrPlayed.fill(false);
						}
						do {
							ind = Math.floor(Math.random() * self.songs.length); //(self.current + 1) % self.songs.length;
						} while ( (arrPlayed[ind]) || ((ind == self.current) && (self.songs.length>1)) ); //ind == self.current: not to play one song twice - in the end of list and in the beginning of newly created list)
						arrPlayed[ind] = true;
						self.current = ind;
					}
					else {
						if(self.current==(self.songs.length-1)){ // if all files are played
							if (!self.config.loopList){
								self.artist.innerHTML = "Playlist ended";
								self.song.innerHTML = "";
								console.log("Playlist ended");
								return;
							}
							self.current = -1;
						}
						self.current++;
					}
					self.sendSocketNotification("LOADFILE", self.songs[self.current]);
				};
				console.log("Music Played");
				break;
		}
	},

	notificationReceived: function(notification, payload){
		var self = this;
		switch(notification){
			case "PLAY_MUSIC":
				if (audioElement.paused){
					audioElement.play();
				}
				else {
					self.sendSocketNotification("LOADFILE", self.songs[self.current]);
				}
				break;
			case "STOP_MUSIC":
				audioElement.pause();
				break;
			case "NEXT_TRACK":
				if(!self.musicFound){
					self.album_art.classList.toggle('active');
					return;
				}
				if (self.config.random){
					if (!arrPlayed.includes(false)){
						arrPlayed.fill(false);
					}
					do {
						ind = Math.floor(Math.random() * self.songs.length); // (self.current + 1) % self.songs.length;
					} while (arrPlayed[ind] || ind == self.current); // ind == self.current: not to play one song twice - in the end of list and in the beginning of newly created list)
					arrPlayed[ind] = true;
					self.current = ind;
				}
				else {
					if(self.current==(self.songs.length-1)){ // this assures the loop
						self.current = -1;
					}
					self.current++;
				}
				self.sendSocketNotification("LOADFILE", self.songs[self.current]);
				break;
			case "PREVIOUS_TRACK":
				if(self.current==0){ // this assures the loop
						self.current = (self.songs.length);
					}
				self.current--;
				self.sendSocketNotification("LOADFILE", self.songs[self.current]);
				break;
		}
	}
});