import { reloadGame } from './game.js';
const wsEndpoint = 'ws://' + window.location.host + '/ws/queue/';
const websocket = new WebSocket(wsEndpoint);

websocket.onopen = () => {
    console.log('WebSocket Queue connected');
};

websocket.onmessage = function(event) {
    var data = JSON.parse(event.data);
    console.log('Event Queue Socket : ' + data.type);
    if (data.type === 'game_start') {
        reloadGame(data.game_id, data.p1_pseudo, data.p2_pseudo);
        console.log(data.message);
        $('#Msg').text('Message: ' + data.message);
    }
    else if (data.type === 'msg') {
        $('#Msg').text('Message: ' + data.message);
    }
};

function LaunchQueue() {
    console.log('test')
    websocket.send(
        JSON.stringify({
            action: 'join_queue',
        })
    );
    var HideDiv = document.getElementById('JoinQueue');
    HideDiv.style.display = 'none';
    var showDiv = document.getElementById('LeaveQueue');
    showDiv.style.display = 'block';
}

function LeaveQueue() {
    websocket.send(
        JSON.stringify({
            action: 'leave_queue',
        })
    );
    var HideDiv = document.getElementById('LeaveQueue');
    HideDiv.style.display = 'none';
    var showDiv = document.getElementById('JoinQueue');
    showDiv.style.display = 'block';
}

document.getElementById('JoinQueue').addEventListener('click', LaunchQueue);
document.getElementById('LeaveQueue').addEventListener('click', LeaveQueue);

