let layers = {};
let map = null;
let project = null;
let layer_cnt = 0;
let mylayer = null;
let zip = null;
let config = null;

async function setup()
{
    await this.load_file('./surveys/jenolan/mammoth/mammoth.zip');
    await zip.file('survey.json').async('string').then((data) => config = data);
    config = JSON.parse(config);

    console.log(zip, config);
    let bounds = this.get_survey_bounds(config);
    console.log(bounds);
    map = L.map('map', {
        crs: L.CRS.Simple,
        minZoom: -4,
        maxZoom: 1,
        zoomSnap: 0.25,
        zoomDelta: 0.25,
        maxBounds: bounds,
        maxBoundsViscosity: 0.5,
    });

    await add_layers();
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

function showfilebrowser()
{
    $('#file').click();
}

async function file_selected()
{
    let el = $('#file').get(0);
    if (!el.files.length) return; 
    let file = el.files[0];

    await this.read_zip(file);

    await zip.file('survey.json').async('string').then((data) => config = data);
    config = JSON.parse(config);

    console.log(zip, config);
    let bounds = this.get_survey_bounds(config);
    console.log(bounds);
    if (map) map.remove();
    map = L.map('map', {
        crs: L.CRS.Simple,
        minZoom: -4,
        maxZoom: 1,
        zoomSnap: 0.25,
        zoomDelta: 0.25,
        maxBounds: bounds,
        maxBoundsViscosity: 0.5,
    });

    await add_layers();
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

async function add_layers()
{
    for (let layer of config.layers)
    {
        layer_cnt++;
        let level = 0;
        if (layer.grouping != '') level = layer.grouping.split('.').length;

        let image = null;
        await zip.file(layer.path).async('blob').then(data => image = data);
        let url = URL.createObjectURL(image);
        let overlay = L.imageOverlay(url, layer.bounds, {
            opacity: 1,
            zIndex: level
        }).addTo(map);
        //URL.revokeObjectURL(url);     // cannot revoke at this point since files are not loaded immediately. Does leaflet have a 'loaded' callback that could be used for this?
        layers[layer_cnt] = {
            name: layer.name,
            url: layer.url,
            bounds: layer.bounds,
            grouping: layer.grouping,
            actual_size: layer.actual_size,
            default_state: layer.default_state,
            state: layer.default_state,
            overlay: overlay
        };
        if (layer.default_state == 'inactive') map.removeLayer(overlay);
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

function load_file(path)
{
    return new Promise((resolve, reject) => {
        const req = new XMLHttpRequest();
        req.onload = (e) => {
            const arraybuffer = req.response; // not responseText
            console.log(arraybuffer);
            let Z = new JSZip();
            Z.loadAsync(arraybuffer)
                .then((newzip) => {
                    zip = newzip;
                    //console.log(zip);
                    resolve();
                    return;
                    let survey = zip.file('survey.json').async('string').then((data) => alert(data));
                    
                    zip.folder("").forEach(function (relativePath, file){
                        console.log("iterating over", relativePath);
                    });
                    //alert(zip.files.length);
                }, (e) => {
                    //console.log('error loading zip', e);
                    reject('Error reading zip file');
                });

        };
        req.open("GET", path);
        req.responseType = "arraybuffer";
        req.addEventListener("error", (xhr, event) => reject('Error loading file'));
        req.send();
    });   
}

function read_zip(file)
{
    return new Promise((resolve, reject) => {
        let Z = new JSZip();
        Z.loadAsync(file)
            .then((newzipobj) => {
                zip = newzipobj;
                console.log(zip);
                resolve();
                return;
                let survey = zip.file('survey.json').async('string').then((data) => alert(data));
                
                zip.folder("").forEach(function (relativePath, file){
                    console.log("iterating over", relativePath);
                });
                //alert(zip.files.length);
            }, (e) => {
                //console.log('error loading zip', e);
                reject('Error reading zip file');
            });
    });
}

function get_survey_bounds(config)
{
    let min = {x: null, y: null};
    let max = {x: null, y: null};
    for (layer of config.layers)
    {
        // Min for X
        if (min.x == null) min.x = layer.bounds[0][1];
        else if (min.x > layer.bounds[0][1]) min.x = layer.bounds[0][1];
        // Min for Y
        if (min.y == null) min.y = layer.bounds[0][0];
        else if (min.y > layer.bounds[0][0]) min.y = layer.bounds[0][0];

        // Max for X
        if (max.x == null) max.x = layer.bounds[1][1];
        else if (max.x < layer.bounds[1][1]) max.x = layer.bounds[1][1];
        // Max for Y
        if (max.y == null) max.y = layer.bounds[1][0];
        else if (max.y < layer.bounds[1][0]) max.y = layer.bounds[1][0];
    }
    return [[min.y - 1000, min.x - 1000], [max.y + 1000, max.x + 1000]];        // add 1000 pixel padding
}
