$(document).ready(function(){
    update_status();

    update_playlist();

    $('.previous', '.controls').on('click', previous);
    $('.next', '.controls').on('click', next);
    $('.pause', '.controls').on('click', pause);
    $('.play', '.controls').on('click', play);
});

function update_playlist()
{
    // Updates the playlist
    $.ajax({
        url: 'http://musicbrainz.i.bolkhuis.nl/player/mjs/mp3soos/playlist',
        method: 'GET',
        success: function(result) {
            $('.playlist').html('');
            $(result.items).each(function(){
                var item = $('<li>').text(this.location).appendTo('.playlist');
                if (this.url == $('.current-song').attr('data-url')) {
                    item.addClass('current');
                }
            });
        },        
    });

    // Do this every three seconds
    setTimeout(update_playlist, 3000);
}

function update_status()
{
    // Get the currently playing song
    $.ajax({
        url: 'http://musicbrainz.i.bolkhuis.nl/player/mjs/mp3soos/current',
        type: 'GET',
        dataType: 'JSON',
        success: function(result){
            // Update position
            $('.position').val(result.position).attr('max', result.duration);
            var pos_minutes = Math.floor(result.position / 60)
            var pos_seconds = result.position % 60;
            var dur_minutes = Math.floor(result.duration / 60);
            var dur_seconds = result.duration % 60;
            $('.pos_minutes').text(pos_minutes);
            $('.pos_seconds').text(pos_seconds >= 10 ? (pos_seconds) : ('0' + pos_seconds));
            $('.dur_minutes').text(dur_minutes);
            $('.dur_seconds').text(dur_seconds >= 10 ? (dur_seconds) : ('0' + dur_seconds));

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
