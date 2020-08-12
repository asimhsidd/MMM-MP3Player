# ! IN TESTING !

# MMM-MP3Player

## About
A [MagicMirror²](https://github.com/MichMich/MagicMirror/) module for playing music from folder at start up.
This is the version of the [MMM-MP3Player module](https://github.com/asimhsidd/MMM-MP3Player) remade to my needs.
As soon as the module is loaded, the music starts playing!

![picture](Capture1.JPG) <br>
![picture](Capture2.JPG)

* module only supports .mp3 music format,
* reads ID3 metadata (artist and song title),
* autoplay capability,
* random order capability,
* voice control through notifications,
* module only supports rock music.

## Dependencies:
Beside the core modules, this module uses one dependency:

| Module     | URL    |
| -----------|-------------------------------------------|
| node-id3 | https://www.npmjs.com/package/node-id3 |

## Installation

* `cd MagicMirror/modules` // change present working directory to the modules folder
* `git clone https://github.com/x3mEr/MMM-MP3Player.git` // clone the module from github
* `cd MMM-MP3Player` // navigate to the MMM-MP3Player directory
* `npm install` // install dependencies
* Add the following configuration to the modules array in the `MagicMirror/config/config.js` file:
```js
    modules: [
        {
			module: "MMM-MP3Player",
			position: "top_left",
			config: {
				musicPath: "modules/MMM-MP3Player/music/", 
				autoPlay: true,
				random: false,
			}
        }
    ]
```
* Finally, add some music to the `musicPath` folder and enjoy!

## Configuration

| Option		| Description |
| -----------|-------------------------------------------|
| `musicPath`	| The path of the folder with .mp3 files. <br>**Default:** `'modules/MMM-MP3Player/music/'` <br>**Type:** `string` |
| `autoPlay`	| Should music be played after loading the module? <br>**Default:** `true` <br>**Type:** `boolean` |
| `random`	| Should music be shuffled? <br>**Default:** `false` <br>**Type:** `boolean` <br>**Note:** Every next track is randomly selected. So after the playlist ends the order of tracks will be another. |
* In case of `random: true`, previous track is not a track, played previously, it's a previous file in `musicPath` folder.

## Voice control

The playback can be controlled from another module (i.e. [voicecontrol](https://github.com/alexyak/voicecontrol)) with notifications.
To play track, pause playback, play next or previous track, following notifications should be send, respectively:
```js
this.sendNotification('PLAY_MUSIC', 'some_info');
this.sendNotification('STOP_MUSIC', 'some_info');
this.sendNotification('NEXT_TRACK', 'some_info');
this.sendNotification('PREVIOUS_TRACK', 'some_info');
```
