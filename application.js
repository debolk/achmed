$(document).ready(function(){

    // Check for availability
    check_device_status();

    // Process clicks
    $('.pause', '.controls').on('click', function(){
        send_ajax('PUT', '/status', {status: 'paused'});
    });

    $('.play', '.controls').on('click', function() {
        send_ajax('PUT', '/status', {status: 'playing'});
    });

    $('#enlightenment').on('click', mandatory_enlightenment);

    // Login is required before taking actions
    var authorization_token = getAuthorisationCodeFromURL();
    if (authorization_token === null) {
        // Not authenticated, must login
        window.location = Achmed.config.oauth.endpoint
                                + 'authorize?response_type=code'
                                + '&client_id=' + Achmed.config.oauth.client_id
                                + '&client_pass=' + Achmed.config.oauth.client_pass
                                + '&redirect_uri=' +Achmed.config.app_url
                                + '&state=1';
    }
    else {
        // Logged in, request access_token to access services
        $.ajax({
            type: 'POST',
            url: Achmed.config.oauth.endpoint + 'token',
            contentType: 'application/json',
            dataType: 'json',
            data: JSON.stringify({
                grant_type: 'authorization_code',
                code: authorization_token,
                redirect_uri: Achmed.config.app_url,
                client_id: Achmed.config.oauth.client_id,
                client_secret: Achmed.config.oauth.client_pass,
            }),
            success: function(result){
                window.access_token = result.access_token;
                // Clear the browser URL for cleaner reloads
                history.pushState(null, '', Achmed.config.app_url);

                // Check for authorization
                $.ajax({
                    type: 'GET',
                    url: Achmed.config.oauth.endpoint + 'mp3control?access_token='+window.access_token,
                    success: function(result) {
                        $('button').removeAttr('disabled');
                    },
                    error: function(result) {
                        notify('error', 'You\'re not allowed to use this');
                    }
                });
            },
            error: function(result){
                notify('error', 'Unknown fatal error occurred');
            },
        });
    }
});

function check_device_status()
{
    $.ajax({
        type: 'GET',
        url: 'http://musicbrainz.i.bolkhuis.nl/player/mjs/mp3soos/status',
        error: function() {
            notify('error', 'The music computer doesn\'t answer. It might be turned off.');
        },
        success: function(result){
            if (result === null) {
                notify('error', 'The music computer doesn\'t answer. It might be turned off.');
            }
        },
    });
}

function getAuthorisationCodeFromURL() {
    regex = RegExp(/code=(.+?)(\&|$)/).exec(location.search);

    if (regex === null) {
        return null;
    }
    else {
        return regex[1];
    }
}

function send_ajax(method, endpoint, data)
{
    $.ajax({
        type: method,
        url: 'http://musicbrainz.i.bolkhuis.nl/player/mjs/mp3soos'+endpoint+'?access_token='+window.access_token,
        data: JSON.stringify(data),
        contentType: 'application/json',
        dataType: 'json'
    });
}

function notify(code, message)
{
    $('.notifications').html('');
    $('<div>').addClass('notification').addClass(code).text(message).appendTo('.notifications');
}

function mandatory_enlightenment(event)
{
    event.preventDefault();

    if (! confirm('Are you sure? Forced enlightenment is usually not fully appreciated after 5pm.')) {
        return;
    }

    // Determine form of enlightenment: 10% chance of 52 B'VO!
    var song = '';
    if (Math.random() <= 0.10) {
        song = "http://musicbrainz.i.bolkhuis.nl/plugin/file/files/browse/Uploads/Tagged/Alice+Cooper/A+Fistful+of+Alice/Poison.mp3";
    }
    else {
        song = "http://musicbrainz.i.bolkhuis.nl/plugin/file/files/browse/Misc/Christiaan/David+Hasselhoff+-+True+Survivor.mp3";
    }

    // Get current song
    $.ajax({
        type: 'GET',
        url: 'http://musicbrainz.i.bolkhuis.nl/player/mjs/mp3soos/current',
        dataType: 'json',
        contentType: 'application/json',
        success: function(result) {
            // Determine if there's music playing (the playlist is not empty)
            if (! $.isEmptyObject(result)) {
                // Prepend song to current song
                $.ajax({
                    type: 'POST',
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
                    type: 'POST',
                    url: 'http://musicbrainz.i.bolkhuis.nl/player/mjs/mp3soos/playlist?access_token='+window.access_token,
                    dataType: 'JSON',
                    data: JSON.stringify({uri: song}),
                    success: function() {
                        // Press play
                        send_ajax('PUT', '/status', {status: 'playing'});
                    },
                });
            }
        },
    });
}
