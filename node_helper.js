/* Magic Mirror
 * Node Helper: MMM-MP3Player
 *
 * By asimhsidd
 * MIT Licensed.
 */

const NodeHelper = require("node_helper");
const USB = require('usb');
const ID3 = require('node-id3');
const Drives = require('drivelist');
const path = require('path')
const fs = require('fs');

var drive_path,drive_description = "";
var music_files_list = [];
var loaded = false;

module.exports = NodeHelper.create({
	socketNotificationReceived: function(notification, payload) {
		var self = this;
		switch(notification) {
			case "INITIATEDEVICES":
				drive_path,drive_description = "";
				music_files_list = [];
				var self = this;
				Drives.list((error, drives) => {
					drives.forEach((drive) => {
						if (!drive.isSystem && drive.isUSB){
							drive_description = drive.description;
							drive_path = path.normalize(drive.mountpoints[0].path);
							self.searchMP3(drive_path);
							if(music_files_list.length){
								self.sendSocketNotification("Music_Files",music_files_list);
							}
						}
					});
				});
				USB.on('attach', function(device) {
					if (self.loaded == true){ return; }
					setTimeout(function(){ // In order for the OS to allocate a drive address to the new usb drive
						Drives.list((error, drives) => {
							drives.forEach((drive) => {
								if (!drive.isSystem && drive.isUSB){
									drive_path = path.normalize(drive.mountpoints[0].path);
									self.searchMP3(drive_path);
									if(music_files_list.length){
										self.sendSocketNotification("Music_Files",music_files_list);
										self.loaded = true;
									}
								}
							});
						});						
					},2000);
				});
				USB.on('detach', function(device) {
					if (self.loaded == false){ return; }
					setTimeout(function(){ // In order to check if the unplugged usb device is our usb
						Drives.list((error, drives) => {
							drives.forEach((drive) => {
								if (drive_description = drive.description){
									return; // confirmed: the device is still attached
								}
							});
							self.sendSocketNotification("Error","USB Detached");
							self.loaded = false;
						});						
					},2000);
				});					
				break;
			case "LOADFILE":
				if (fs.existsSync(payload)){
					fs.readFile(payload, function(err, data) {
						tags = ID3.read(data);
						self.sendSocketNotification("Music_File",[data,[tags.artist,tags.title]]);
					});
				}else{
					self.sendSocketNotification("Error","File Dont Exist");
				}
				break;
		}
	},
	searchMP3(startPath){ // thanks to Lucio M. Tato at https://stackoverflow.com/questions/25460574/find-files-by-extension-html-under-a-folder-in-nodejs
		var self = this;
		var filter = RegExp(".mp3");
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
			}else if (filter.test(filename)){
				music_files_list.push(filename.replace(/\/\/+/g, '/')); // to avoid double slashes (https://stackoverflow.com/questions/23584117/replace-multiple-slashes-in-text-with-single-slash-with-javascript/23584219)
			}
		}
	}
});
