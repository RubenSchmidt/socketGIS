/**
 * Created by rubenschmidt on 08.02.2016.
 */

socketGis.controller("mapController", function ($scope, $http, $timeout, socket) {
    $scope.map = init();
    var geoJSONFormat = new ol.format.GeoJSON();

    $scope.interactionTypes = ['None', 'Point', 'LineString', 'Polygon', 'Circle', 'Square', 'Box'];
    $scope.interactionType = 'None';

    $scope.show = {
        slider: false,
        interactionTypes: false
    };

    // Functions
    $scope.toggleSlider = function () {
        $scope.show.slider = (!$scope.show.slider);
        $timeout(function () {
            $scope.map.updateSize();
        }, 300);
    };

    $scope.toggle = function(type) {
        $scope.show[type] = $scope.show[type] ? false : true;
    };

    $scope.addInteraction = function addInteraction(type) {
        $scope.interactionType = type;
        $scope.show.interactionTypes = false;
        $scope.draw;

        var value = $scope.interactionType;

        if (value !== 'None') {
            var geometryFunction, maxPoints;
            if (value === 'Square') {
                value = 'Circle';
                geometryFunction = ol.interaction.Draw.createRegularPolygon(4);
            } else if (value === 'Box') {
                value = 'LineString';
                maxPoints = 2;
                geometryFunction = function (coordinates, geometry) {
                    if (!geometry) {
                        geometry = new ol.geom.Polygon(null);
                    }
                    var start = coordinates[0];
                    var end = coordinates[1];
                    geometry.setCoordinates([
                        [start, [start[0], end[1]], end, [end[0], start[1]], start]
                    ]);
                    return geometry;
                };
            }
            //If already a draw is defined remove it first.
            if($scope.draw){
                $scope.map.removeInteraction($scope.draw);
            }

            $scope.draw = new ol.interaction.Draw({
                source: $scope.drawSource,
                type: /** @type {ol.geom.GeometryType} */ (value),
                geometryFunction: geometryFunction,
                maxPoints: maxPoints
            });
            $scope.map.addInteraction($scope.draw);
            //When finished drawing
            $scope.draw.on('drawend', saveDrawing);
        } else {
            //None is selected, we remove the current selected drawing type
            if($scope.draw){
                $scope.map.removeInteraction($scope.draw);
            }

        }
    };

    $scope.deleteSelected = function deleteSelected() {
        $scope.selectedFeatures.forEach(function (feature) {
            var id = feature.getId();
            console.log(id);
            var type = geoJSONFormat.writeFeatureObject(feature).geometry.type;
            switch (type) {
                case 'Point':
                    socket.emit('delete point', id);
                    break;
                case 'LineString':
                    socket.emit('delete line', id);
                    break;
                case 'Polygon':
                    socket.emit('delete poly', id);
                    break;
                case 'GeometryCollection':
                    console.log('geometry collection not ready');
                    break;
                default:
                    console.log('Not defined feature');
            }
            if (vectorSource.getFeatureById(id)) {
                $scope.vectorSource.removeFeature(feature);
            }
            if (drawSource.getFeatureById(id)) {
                $scope.drawSource.removeFeature(feature);
            }
            $scope.selectedFeatures.clear();
        });
    };


    $scope.addShape = function addShape() {
        //for the shapefiles in the folder called 'files' with the name pandr.shp
        shp("shapefiles/arealbruk.zip").then(function (geojson) {
            //do something with your geojson
            console.log(JSON.stringify(geojson));
            var features = geoJSONFormat.readFeatures(geojson,{dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
            $scope.vectorSource.addFeatures(features);
        });
    };


    // a normal select interaction to handle click on features
    var select = new ol.interaction.Select();
    $scope.map.addInteraction(select);

    //Get the selected features
    $scope.selectedFeatures = select.getFeatures();

    $scope.map.on('click', function () {
        console.log("click");
        $scope.selectedFeatures.clear();
    });

    // a DragBox interaction used to select features by drawing boxes while holding, cmd og ctrl
    $scope.dragBox = new ol.interaction.DragBox({
        condition: ol.events.condition.platformModifierKeyOnly
    });

    $scope.map.addInteraction($scope.dragBox);

    $scope.dragBox.on('boxend', function (e) {
        // features that intersect the box are added to the collection of
        // selected features
        var extent = $scope.dragBox.getGeometry().getExtent();
        $scope.vectorSource.forEachFeatureIntersectingExtent(extent, function (feature) {
            $scope.selectedFeatures.push(feature);
        });

    });

    //Marker for geolocation
    $scope.positionFeature = new ol.Feature();
    $scope.positionFeature.setStyle(new ol.style.Style({
        image: new ol.style.Circle({
            radius: 6,
            fill: new ol.style.Fill({
                color: '#3399CC'
            }),
            stroke: new ol.style.Stroke({
                color: '#fff',
                width: 2
            })
        })
    }));
    //Add the feature to the map
    $scope.vectorSource.addFeature($scope.positionFeature);

    //On change create the marker
    $scope.geolocation.on('change:position', function () {
        var coordinates = $scope.geolocation.getPosition();
        $scope.positionFeature.setGeometry(coordinates ?
            new ol.geom.Point(coordinates) : null);
    });

    $scope.deleteSelected = function deleteSelected() {
        //Iterate through all the features and delete them.
        $scope.selectedFeatures.forEach(function (feature) {
            var id = feature.getId();
            if (id) {
                var type = geoJSONFormat.writeFeatureObject(feature).geometry.type;
                switch (type) {
                    case 'Point':
                        socket.emit('delete point', id);
                        break;
                    case 'LineString':
                        socket.emit('delete line', id);
                        break;
                    case 'Polygon':
                        socket.emit('delete poly', id);
                        break;
                    case 'GeometryCollection':
                        console.log('geometry collection not ready');
                        break;
                    default:
                        console.log('Not defined feature');
                }
                if ($scope.vectorSource.getFeatureById(id)) {
                    $scope.vectorSource.removeFeature(feature);
                }
                if ($scope.drawSource.getFeatureById(id)) {
                    $scope.drawSource.removeFeature(feature);
                }
            }
        });
        //Clear the list of selected features
        $scope.selectedFeatures.clear();
    };

    //File upload functions, used with ng-file-upload
    $scope.$watch('file', function () {
        if ($scope.file != null) {
            console.log($scope.file);
            shp($scope.file).then(function (geojson) {
                console.log("kom inn");
                var features = geoJSONFormat.readFeatures(geojson,{dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
                $scope.vectorSource.addFeatures(features);
            });
        }
    });

    $scope.upload = function (file) {
        console.log(file);
    };

    //WEBSOCKET ONS BELOW
    //On start of connection, the server sends the stored points. TODO change this.
    socket.forward('all points', $scope);
    $scope.$on('socket:all points', function (ev, data) {
        data.forEach(function (point) {
            //Create valid geojson
            var p = turf.point(point.loc.coordinates);
            //read the geojson and make a feature of it
            var feature = geoJSONFormat.readFeature(p, {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
            //Set id for easy retrieval
            feature.setId(point._id);
            //Add feature to vectorlayer drawSource
            $scope.vectorSource.addFeature(feature);
        })
    });


    socket.forward('all points', $scope);
    $scope.$on('socket:all lines', function (ev, data) {
        data.forEach(function (line) {
            var l = turf.linestring(line.loc.coordinates);
            var feature = geoJSONFormat.readFeature(l, {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
            feature.setId(line._id);
            //Add feature to vectorlayer drawSource
            $scope.vectorSource.addFeature(feature);
        })
    });

    socket.forward('all polys', $scope);
    $scope.$on('socket:all polys', function (ev, data) {
        data.forEach(function (poly) {
            var p = turf.polygon(poly.loc.coordinates);
            var feature = geoJSONFormat.readFeature(p, {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
            feature.setId(poly._id);
            $scope.vectorSource.addFeature(feature);
        })
    });

    socket.forward('new point', $scope);
    $scope.$on('socket:new point', function (ev, data) {
        var p = turf.point(data.loc.coordinates);
        var feature = geoJSONFormat.readFeature(p, {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
        feature.setId(data._id);
        //Add feature to vectorlayer drawSource
        $scope.vectorSource.addFeature(feature);
    });

    socket.forward('done buffering', $scope);
    $scope.$on('socket:done buffering', function (ev, data) {
        var geometry = geoJSONFormat.readGeometry(data);
        var feature = new ol.Feature({'geometry': geometry});
        $scope.vectorSource.addFeature(feature);
        //Write the buffer in right format for database and send it.
        var geoObject = geoJSONFormat.writeFeatureObject(feature, {
            dataProjection: 'EPSG:4326',
            featureProjection: 'EPSG:3857'
        });
        socket.emit('add poly', geoObject);
    });

    function init() {
        $scope.drawSource = new ol.source.Vector({wrapX: false});
        $scope.vectorSource = new ol.source.Vector({wrapX: false});

        //Layer for dbFeatures
        var saved = new ol.layer.Vector({
            source: $scope.vectorSource
        });

        //Layer for drawing
        var vector = new ol.layer.Vector({
            source: $scope.drawSource,
            style: new ol.style.Style({
                fill: new ol.style.Fill({
                    color: 'rgba(255, 255, 255, 0.2)'
                }),
                stroke: new ol.style.Stroke({
                    color: '#ffcc33',
                    width: 2
                }),
                image: new ol.style.Circle({
                    radius: 7,
                    fill: new ol.style.Fill({
                        color: '#ffcc33'
                    })
                })
            })
        });

        var view = new ol.View({
            center: ol.proj.transform([10.3933, 63.4297], 'EPSG:4326', 'EPSG:3857'),
            zoom: 13
        });

        var map = new ol.Map({
            target: 'map',
            layers: [
                new ol.layer.Tile({
                    source: new ol.source.OSM()
                }),
                vector, saved],
            view: view
        });

        $scope.geolocation = new ol.Geolocation({
            // take the projection to use from the map's view
            projection: view.getProjection()
        });

        $scope.geolocation.setTracking(true);

        return map;
    }

    function saveDrawing(event) {
        var feature = event.feature;
        //Write the feature to a geojsonobject.
        var geoObject = geoJSONFormat.writeFeatureObject(feature, {
            dataProjection: 'EPSG:4326',
            featureProjection: 'EPSG:3857'
        });
        switch (geoObject.geometry.type) {
            case 'Point':
                socket.emit('add point', geoObject);
                break;
            case 'LineString':
                socket.emit('add line', geoObject);
                break;
            case 'Polygon':
                socket.emit('add poly', geoObject);
                break;
            case 'GeometryCollection':
                console.log('geometry collection not ready');
                break;
            default:
                console.log('Not defined feature');
        }
    }
});
