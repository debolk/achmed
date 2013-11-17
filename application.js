$(document).ready(function(){
    update_status();

    $('.controls').on('click', 'button', set_status);
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

function set_status(event)
{
    event.preventDefault();

    // Get desired status
    var status = $(this).attr('data-action');

    // Update server
    $.ajax({
        type: 'POST',
        url: 'http://musicbrainz.i.bolkhuis.nl/player/mjs/mp3soos/status',
        data: JSON.stringify({status: status}),
        contentType: 'JSON',
    });
}
