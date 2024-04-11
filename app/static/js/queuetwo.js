const wsEndpoint = 'ws://' + window.location.host + '/ws/queuetwo/';
const websocket = new WebSocket(wsEndpoint);

websocket.onopen = () => {
    console.log('WebSocket Queue connected');
};

websocket.onmessage = function(event) {
    var data = JSON.parse(event.data);
    console.log('Event Queue Socket : ' + data.type);
    if (data.type === 'game_start') {
        var HideDiv = document.getElementById('LeaveQueue');
        HideDiv.style.display = 'none';
        import('/static/js/gametwo.js')
        .then(module => {
            const { reloadGame2 } = module;
            reloadGame2(data.game_id, data.p1_pseudo, data.p2_pseudo);
        })
        .catch(error => {
            console.error('Une erreur s\'est produite lors du chargement de game.js : ', error);
        });
        console.log(data.message);
        $('#Msg').text('Message: ' + data.message);
    }
    else if (data.type === 'msg') {
        $('#Msg').text('Message: ' + data.message);
    }
};

function LaunchQueue2() {
    websocket.send(
        JSON.stringify({
            action: 'join_queue',
        })
    );
    var HideDiv = document.getElementById('ChooseGame');
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
    $('#Msg').text('');
    HideDiv.style.display = 'none';
    var showDiv = document.getElementById('ChooseGame');
    showDiv.style.display = 'block';
}

document.getElementById('TronGame').addEventListener('click', LaunchQueue2);
document.getElementById('LeaveQueue').addEventListener('click', LeaveQueue);
