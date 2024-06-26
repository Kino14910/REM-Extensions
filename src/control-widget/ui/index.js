const $ = require('./jquery.js')

const { connect, subscribe, win } = window

const { ipcRenderer } = require('electron')
const player = connect('player-controller')
const playlist = connect('playlist')
const update = subscribe('playstate', ([ playing, p ]) => {
    $('.music_progress_line').css('width', `${p * 100}%`)
    $(".cover").css("animation-play-state", playing ? "running" : "paused")
    $("#playBtn")
        .removeClass(playing ? "fa-play" : "fa-pause")
        .addClass(playing ? "fa-pause" : "fa-play")
})
const playerUpdate = subscribe('player', render)

let mainWinVisible = false
const mainWindowUpdate = subscribe('mainWindowVisible', ([ visible ]) => {
    mainWinVisible = visible

    visible
        ? $('#expand').addClass('col')
        : $('#expand').removeClass('col')
        
})

win.beforeClose = async () => {
    await player.close()
    await update.close()
    await playlist.close()
    await playerUpdate.close()
    await mainWindowUpdate.close()
}

render()

let duration = Infinity

;(async() => {
    const { colorHue, dark } = await ipcRenderer.invoke('app?theme')
    if (dark) {
        $('body').addClass('dark')
    } else {
        $('body').removeClass('dark')
    }

    $('.music_progress_line').css('background-color', `hsl(${colorHue}, 90%, 80%)`)
})()

$('.music_progress_bar').on('click', ev => {
    const seekTo = ev.offsetX / 360 * duration
    player.invoke(`:seek|${seekTo}`)
})

$("#expand").on("click", function () {
    !mainWinVisible
        ? ipcRenderer.send('app:restoreMainWindow')
        : ipcRenderer.send('app:hideMainWindow')
})

$("#playBtn").on("click", async function () {
    const playing = await player.invoke(".isPlaying")
    await player.invoke(playing ? ':pause' : ':play')
    await render()
})

$("#prevBtn").on("click", async function () {
    playlist.invoke(":previous")
    await render()
})

$("#nextBtn").on("click", async function () {
    playlist.invoke(":next")
    await render()
})

async function render() {
    const {
        name,
        al,
        ar,
    } = await player.invoke('.audioData')
    duration = Number(await player.invoke(".duration"))

    $(".name").text(name)
    $(".singer-album").text(ar.map(a => a.name).join(', ') + " - " + al.name)
    $(".time").text(duration)
    $("#img").attr("src", al.picUrl)
}