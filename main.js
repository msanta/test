let layers = {};
let map = null;
let project = null;
let layer_cnt = 0;

function setup()
{
    project = get_project();

    var bounds = [[0,0], [400, 400]];
    map = L.map('map', {
        crs: L.CRS.Simple,
        minZoom: -4,
        maxZoom: 1,
        zoomSnap: 0.25,
        zoomDelta: 0.25,
        maxBounds: bounds,
        maxBoundsViscosity: 0.5,
    });

    add_layers();
    populate_layers_list();

    map.fitBounds(bounds);
    map.setZoom(0);


    map.on('click', function(e){
        var coord = e.latlng;
        var lat = coord.lat;
        var lng = coord.lng;
        console.log("You clicked the map at latitude: " + lat + " and longitude: " + lng);
        });
}

function add_layers()
{
    for (let layer of project.layers)
    {
        layer_cnt++;
        //console.log(layer);
        let level = 0;
        if (layer.grouping != '') level = layer.grouping.split('.').length;
        if (layer.default_state == 'active')
        {
            let image = L.imageOverlay(layer.url, layer.bounds, {
                opacity: 1,
                zIndex: level
            }).addTo(map);
            layers[layer_cnt] = {
                name: layer.name,
                url: layer.url,
                bounds: layer.bounds,
                grouping: layer.grouping,
                actual_size: layer.actual_size,
                default_state: layer.default_state,
                state: 'active',
                overlay: image
            };
        }
        else
        {
            layers[layer_cnt] = {
                name: layer.name,
                url: layer.url,
                bounds: layer.bounds,
                grouping: layer.grouping,
                actual_size: layer.actual_size,
                default_state: layer.default_state,
                state: 'inactive',
                overlay: null
            };
        }
    }
}

function show_layer(layer_id)
{
    if (layers[layer_id] == undefined)
    {
        console.error('Invalid layer ID');
        return;
    }
    let layer = layers[layer_id];
    if (layer.overlay != null)
    {
        map.addLayer(layer.overlay);
    }
    else
    {
        let level = 0;
        if (layer.grouping != '') level = layer.grouping.split('.').length;
        let image = L.imageOverlay(layer.url, layer.bounds, {
            opacity: 1,
            zIndex: level
        }).addTo(map);
        layers[layer_id].overlay = image;
    }
    $('#layer_id_' + layer_id).addClass('layer_active');
}

function hide_layer(layer_id)
{
    if (layers[layer_id] == undefined)
    {
        console.error('Invalid layer ID');
        return;
    }
    let layer = layers[layer_id];
    if (layer.overlay != null)
    {
        map.removeLayer(layer.overlay);
    }
    $('#layer_id_' + layer_id).removeClass('layer_active');
}

function populate_layers_list()
{
    let html = '';

    for (let id in layers)
    {
        //let state = "layer_" + ;
        let layer = layers[id];
        let level = 0;
        if (layer.grouping != '') level = layer.grouping.split('.').length;
        html += '<div id="layer_id_' + id 
                    + '" layer_id="' + id 
                    + '" layer_state="' + layer.default_state 
                    + '" class="layer_level_' + level + ' layer_' + layer.default_state + ' pt-2 pb-2">' + layer.name + '</div>';
    }
    $('#layers_list').html(html);
    
    $('#layers_list > div').on('click', function(e) {
        let id = $(e.target).attr('layer_id');
        let layer = layers[id];
        if (layer.state == 'active')
        {
            hide_layer(id);
            layers[id].state = 'inactive';
        }
        else
        {
            show_layer(id);
            layers[id].state = 'active';
        }
    });
}


/**
 * url - the map url
 * name - a name for this map
 * bounds - the lower left an upper right corner coordinates of the image
 * grouping - the grouping that the overlay belongs to. For example mammoth, mammoth.south, mammoth.north.world_of_mud, mammoth.north.middle_bit
 */
function get_project()
{
    return {
        "project": "test",
        "name": "Test",
        "layers": [
            {
                "url": "./surveys/test/one.jpg",
                "name": "Test 1",
                "bounds": [[0, 0], [200, 200]],
                "grouping": "",
                "actual_size": [200, 200],
                "default_state": "active"
            },
            {
                "url": "./surveys/test/two.jpg",
                "name": "Test 2",
                "bounds": [[0, 200], [200, 400]],
                "grouping": "",
                "actual_size": [200, 200],
                "default_state": "active"
            },
            {
                "url": "./surveys/test/three.jpg",
                "name": "Test 3",
                "bounds": [[200, 200], [400, 400]],
                "grouping": "",
                "actual_size": [200, 200],
                "default_state": "inactive"
            },
            {
                "url": "./surveys/test/four.jpg",
                "name": "Test 4",
                "bounds": [[200, 0], [400, 200]],
                "grouping": "",
                "actual_size": [200, 200],
                "default_state": "inactive"
            }
            
        ]
    };
}
