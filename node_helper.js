/* Magic Mirror Node Helper: MMM-MP3Player
 * By asimhsidd
 *
 * Remade by Pavel Smelov.
 * Version 1.1.0 - 2020.09.04
 * GPLv3 License
 */

const NodeHelper = require("node_helper");
const ID3 = require('node-id3');
const path = require('path')
const fs = require('fs');

var drive_path = "";
var music_files_list = [];

module.exports = NodeHelper.create({
	socketNotificationReceived: function(notification, payload) {
		var self = this;
		switch(notification) {
			case "INITIATEDEVICES":
				drive_path = "";
				music_files_list = [];
				var self = this;
				drive_path = payload.musicPath;
				self.searchMP3(drive_path);
				if(music_files_list.length){
					self.sendSocketNotification("Music_Files",music_files_list);
				}
				break;
			case "LOADFILE":
				console.log('trying to play next track');
				if (fs.existsSync(payload)){
					fs.readFile(payload, function(err, data) {
						extension = path.basename(payload).split('.').pop();
						if (extension == "mp3") {
							tags = ID3.read(data);
							if (typeof tags.artist == "undefined" && typeof tags.title == "undefined"){ tags.title = path.basename(payload); }
						}
						else {
							tags = {artist:"", title:path.basename(payload)};
						}
						self.sendSocketNotification("Music_File",[data,[tags.artist,tags.title], extension]);
					});
				}else{
					self.sendSocketNotification("Error","File Does Not Exist");
				}
				break;
		}
	},
	searchMP3(startPath){ // thanks to Lucio M. Tato at https://stackoverflow.com/questions/25460574/find-files-by-extension-html-under-a-folder-in-nodejs
		var self = this;
		var filter_mp3 = RegExp('.mp3'); // var filter = /.mp3/;
		var filter_flac = RegExp('.flac');
		//var filter_ogg = RegExp('.ogg');
		var filter_wav = RegExp('.wav');
		if (!fs.existsSync(startPath)){
			console.log("no dir ",startPath);
			return;
		}
		var files=fs.readdirSync(startPath);
		for(var i=0;i<files.length;i++){
			var filename=path.join(startPath,files[i]);
			var stat = fs.lstatSync(filename);
			if (stat.isDirectory()){
				self.searchMP3(filename); //recurse
			}else if ( (filter_mp3.test(filename)) || (filter_flac.test(filename)) /*|| (filter_ogg.test(filename))*/ || (filter_wav.test(filename)) ){
				music_files_list.push(filename.replace(/\/\/+/g, '/')); // to avoid double slashes (https://stackoverflow.com/questions/23584117/replace-multiple-slashes-in-text-with-single-slash-with-javascript/23584219)
			}
		}
	}
});
