/* Magic Mirror Module: MMM-MP3Player
 * v1.0.1 - May 2018
 *
 * By Asim Siddiqui <asimhsidd@gmail.com>
 * MIT License
 */

Module.register("MMM-MP3Player",{
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
		self.artist.innerHTML = "MMM-USBPlayer";
		self.song = document.createElement("span");
		self.song.className = "name";
		self.song.innerHTML = "Insert USB Drive";
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
				self.USBAttached = false;
				console.log("USB Detached!");
				break;
			case "Music_Files": // this populates the songs list (array)
				self.songs = payload;
				self.current = 0;
				self.USBAttached = true;
				console.log("USB Attached!");
				console.log("Music Found");
				self.sendSocketNotification("LOADFILE", self.songs[self.current]);
				break;
			case "Music_File": // this is called everytime a song is sent from the server
				// create url of the raw data received and play it
				audioElement=document.getElementById(self.identifier+"_player");
				var binaryData = [];
				binaryData.push(payload[0]);
				var url = window.URL.createObjectURL(new Blob(binaryData, {type: "audio/mpeg"}));
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
					if(!self.USBAttached){
						self.album_art.classList.toggle('active');
						return;
					}
					if(self.current==(self.songs.length-1)){ // this assures the loop
						self.current = -1;
					}
					self.current++;
					self.sendSocketNotification("LOADFILE", self.songs[self.current]);
				};				
				console.log("Music Played");
				break;
		}
	}	
});