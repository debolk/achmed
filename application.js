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

    // Login is required before taking actions
    var authorization_token = getAuthorisationCodeFromURL();
    if (authorization_token === null) {
        // Have we refused authentication before?
        if (userhasRefused()) {
            notify('error', 'You cannot use this without granting access to your account. Reload to try again.');
            history.pushState(null, '', Achmed.config.app_url);
            return;
        }
        // Not authenticated, must login
        window.location = Achmed.config.oauth.endpoint
                                + 'authenticate?response_type=code'
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

function userhasRefused()
{
    regex = RegExp(/error=access_denied/).exec(location.search);
    return (regex !== null);
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
