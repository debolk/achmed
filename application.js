$(document).ready(function(){
    update_status();

    $('.previous', '.controls').on('click', previous);
    $('.next', '.controls').on('click', next);
    $('.pause', '.controls').on('click', pause);
    $('.play', '.controls').on('click', play);

    $('.enlightement').on('click', mandatory_enlightement);

    // Login is required before taking actions
    var authorization_token = getURLParameter('code');
    if (authorization_token === 'null') {  // Yes, this is correct
        // Not authenticated, must login
        window.location = 'https://login.i.bolkhuis.nl/authorize?response_type=code&client_id=achmed&client_pass=&redirect_uri=http://www.debolk.nl/achmed/&state=1';
    }
    else {
        // Logged in, request access_token to access services
        $.ajax({
            method: 'POST',
            url: 'https://login.i.bolkhuis.nl/token',
            dataType: 'JSON',
            data: {
                grant_type: 'authorization_code',
                code: authorization_token,
                redirect_uri: 'http://www.debolk.nl/achmed/',
                client_id: 'achmed',
                client_secret: '',
            },
            success: function(result){
                window.access_token = result.access_token;
                // Clear the browser URL for cleaner reloads
                history.pushState(null, '', 'http://www.debolk.nl/achmed/');

                // Check for authorization
                $.ajax({
                    method: 'GET',
                    url: 'https://login.i.bolkhuis.nl/mp3control?access_token='+window.access_token,
                    success: function(result) {
                        $('button').removeAttr('disabled');
                    }
                });
            },
            error: function(result){
                $('body').html(result + "Please reload.");
            },
        });
    }
});

function mandatory_enlightement(event)
{
    event.preventDefault();

    var song = 'http://musicbrainz.i.bolkhuis.nl//plugin/file/files/browse/Artists/Parov Stelar/Coco/0101 - Coco.mp3'
    
    // Get current song
    $.ajax({
        method: 'GET',
        url: 'http://musicbrainz.i.bolkhuis.nl/player/mjs/mp3soos/current',
        dataType: 'JSON',
        success: function(result) {
            // Determine if there's music playing (the playlist is not empty)
            if (result != {}) {
                // Prepend song to current song
                $.ajax({
                    method: 'POST',
                    url: result.url+'?access_token='+window.access_token,
                    dataType: 'JSON',
                    data: JSON.stringify({uri: song}),
                    success: function() {
                        // Press previous
                        send_ajax('POST', '/current', {action: 'previous'});
                    },
                });
            }
            else {
                // Append song to playlist
                $.ajax({
                    type: method,
                    url: 'http://musicbrainz.i.bolkhuis.nl/player/mjs/mp3soos/playlist?access_token='+window.access_token,
                    data: JSON.stringify({uri: song}),
                    contentType: 'application/json',
                });

                // Press play
                send_ajax('PUT', '/status', {status: 'playing'});
            }
        },
    });
}

function getURLParameter(name) {
    return decodeURI(
        (RegExp(name + '=' + '(.+?)(&|$)').exec(location.search)||[,null])[1]
    );
}

function update_status()
{
    // Get the currently playing song
    $.ajax({
        url: 'http://musicbrainz.i.bolkhuis.nl/player/mjs/mp3soos/current',
        type: 'GET',
        dataType: 'JSON',
        error: function() {
            notify('error', 'Cannot reach mp3bak');
        },
        success: function(result){
            // Check if the device is online and available
            console.log(result);
            if (result == {}) {
                notify('error', ' Cannot reach mp3bak');
            }

            // Update position
            update_current_song_interface(result.position, result.duration);

            // Store URL of the song
            $('.current-song').attr('data-url', result.url);

            // Get the location of the current song
            $.ajax({
                url: result.url,
                type: 'GET',
                dataType: 'JSON',
                success: function(result) {
                    // Process the location of the file
                    var file = result.location;
                    if (file.indexOf('/pub/mp3//') === 0) {
                        file = file.substr(10);
                        
                        // Get the file meta-data
                        $.ajax({
                            url: 'http://musicbrainz.i.bolkhuis.nl/plugin/file/files/browse/'+file,
                            type: 'GET',
                            dataType: 'JSON',
                            success: function(result) {
                                // Update the interface
                                $('.current-song').text(result.artist+' - '+result.title);
                            },
                        });
                    }
                    else {
                        $('.current-song').text('Unable to determine current song');
                    }
                },
            });
        },
    });

    // Do this every second
    setTimeout(update_status, 1000);
}

function update_current_song_interface(position, duration)
{
    $('.position').val(position).attr('max', duration);
    var pos_minutes = Math.floor(position / 60)
    var pos_seconds = position % 60;
    var dur_minutes = Math.floor(duration / 60);
    var dur_seconds = duration % 60;
    $('.pos_minutes').text(pos_minutes);
    $('.pos_seconds').text(pos_seconds >= 10 ? (pos_seconds) : ('0' + pos_seconds));
    $('.dur_minutes').text(dur_minutes);
    $('.dur_seconds').text(dur_seconds >= 10 ? (dur_seconds) : ('0' + dur_seconds));
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
        url: 'http://musicbrainz.i.bolkhuis.nl/player/mjs/mp3soos'+endpoint+'?access_token='+window.access_token,
        data: JSON.stringify(data),
        contentType: 'application/json',
    });
}

function notify(code, message)
{
    $('.notifications').html('');
    $('<div>').addClass('notification error').text(message).appendTo('.notifications');
}
