$(document).ready(function(){
    // Check for availability
    check_device_status();

    $('.pause', '.controls').on('click', pause);
    $('.play', '.controls').on('click', play);

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
                        ga('_trackEvent', 'authentication', 'failAuthorization');
                    }
                });
            },
            error: function(result){
                notify('error', 'Unknown fatal error occurred');
                ga('_trackEvent', 'error', 'unknown');
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
            ga('_trackEvent', 'error', 'mp3computerUnreachable');
        },
        success: function(result){
            if (result === null) {
                notify('error', 'The music computer doesn\'t answer. It might be turned off.');
                ga('_trackEvent', 'error', 'mp3computerUnreachable');
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

function pause()
{
    send_ajax('PUT', '/status', {status: 'paused'});
    ga('_trackEvent', 'button', 'pause');
}

function play()
{
    send_ajax('PUT', '/status', {status: 'playing'});
    ga('_trackEvent', 'button', 'play');
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
    $('<div>').addClass('notification').addClass(code).text(message).appendTo('.notifications');
}
