$(document).ready(function(){
    update_status();

    $('.previous', '.controls').on('click', previous);
    $('.next', '.controls').on('click', next);
    $('.pause', '.controls').on('click', pause);
    $('.play', '.controls').on('click', play);
});

function update_status()
{
    // Update status in the interface
    $.ajax({
        url: 'http://musicbrainz.i.bolkhuis.nl/player/mjs/mp3soos/status',
        type: 'GET',
        dataType: 'JSON',
        success: function(result){
            $('.status').text(result.status);
        },
    });

    // Do this every second
    setTimeout(update_status, 1000);
}

function previous()
{
    send_ajax('POST', '/current', {action: 'previous'});
}

function next()
{
    send_ajax('POST', '/current', {action: 'next'});
}

function pause()
{
    send_ajax('PUT', '/status', {status: 'paused'});
}

function play()
{
    send_ajax('PUT', '/status', {status: 'playing'});
}

function send_ajax(method, endpoint, data)
{
    $.ajax({
        type: method,
        url: 'http://musicbrainz.i.bolkhuis.nl/player/mjs/mp3soos'+endpoint,
        data: JSON.stringify(data),
        contentType: 'application/json',
    });
}
