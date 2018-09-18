class loadSong{
	constructor(selectedSong, autoPlayEnabled, multiplayer){
		this.selectedSong = selectedSong
		this.multiplayer = multiplayer
		this.autoPlayEnabled = autoPlayEnabled
		this.diff = this.selectedSong.difficulty.slice(0, -4)
		this.songFilePath = "/songs/" + this.selectedSong.folder + "/" + this.selectedSong.difficulty
		loader.changePage("loadsong")
		this.run()
	}
	run(){
		var id = this.selectedSong.folder
		var promises = []
		assets.sounds["start"].play()
		
		var img = document.createElement("img")
		promises.push(pageEvents.load(img))
		img.id = "music-bg"
		img.src = "/songs/" + id + "/bg.png"
		document.getElementById("assets").appendChild(img)
		
		promises.push(new Promise((resolve, reject) => {
			var songObj
			assets.songs.forEach(song => {
				if(song.id == id){
					songObj = song
				}
			})
			if(songObj.sound){
				songObj.sound.gain = snd.musicGain
				resolve()
			}else{
				snd.musicGain.load("/songs/" + id + "/main.mp3").then(sound => {
					songObj.sound = sound
					resolve()
				}, reject)
			}
		}))
		promises.push(loader.ajax(this.songFilePath).then(data => {
			this.songData = data.replace(/\0/g, "").split("\n")
		}))
		Promise.all(promises).then(() => {
			this.setupMultiplayer()
		}, error => {
			console.error(error)
			alert("An error occurred, please refresh")
		})
	}
	setupMultiplayer(){
		if(this.multiplayer){
			var loadingText = document.getElementsByClassName("loading-text")[0]
			var waitingText = "Waiting for Another Player..."
			loadingText.firstChild.data = waitingText
			loadingText.setAttribute("alt", waitingText)
			
			this.song2Data = this.songData
			this.selectedSong2 = this.selectedSong
			pageEvents.add(p2, "message", event => {
				if(event.type === "gameload"){
					if(event.value === this.diff){
						p2.send("gamestart")
					}else{
						this.selectedSong2 = {
							title: this.selectedSong.title,
							folder: this.selectedSong.folder,
							difficulty: event.value + ".osu"
						}
						loader.ajax("/songs/" + this.selectedSong2.folder + "/" + this.selectedSong2.difficulty).then(data => {
							this.song2Data = data.replace(/\0/g, "").split("\n")
							p2.send("gamestart")
						}, () => {
							p2.send("gamestart")
						})
					}
				}else if(event.type === "gamestart"){
					this.clean()
					loader.changePage("game")
					var taikoGame1 = new Controller(this.selectedSong, this.songData, false, 1)
					var taikoGame2 = new Controller(this.selectedSong2, this.song2Data, true, 2)
					taikoGame1.run(taikoGame2)
				}
			})
			p2.send("join", {
				id: this.selectedSong.folder,
				diff: this.diff
			})
		}else{
			this.clean()
			loader.changePage("game")
			var taikoGame = new Controller(this.selectedSong, this.songData, this.autoPlayEnabled)
			taikoGame.run()
		}
	}
	clean(){
		pageEvents.remove(p2, "message")
	}
}