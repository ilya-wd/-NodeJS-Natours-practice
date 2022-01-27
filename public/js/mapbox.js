/* eslint-disable */

export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoidXNlcm5hbWVhdiIsImEiOiJja3RicjY1eTMxczYyMnBwYzkzMXF5MmE1In0.eBaUxjWkDm2BmaaTrek1_g';
  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/usernameav/cktbro2f5851n17k7ccvu920e', // using style we created in Mapboc
    scrollZoom: false, // disabling zoom, so that we can scroll when mouse is on the map

    // center: [50, 60],
    // zoom: 6,
    // interactive: false // you can't scroll or pan the map
  });

  // We get access to Mapbox objects 'cause we included its library at the beginning of the page
  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    // Create marker
    const el = document.createElement('div');
    el.className = 'marker';

    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // Add popup
    new mapboxgl.Popup({
      offset: 30,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p> Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    // Extend map bounds to include current location
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    },
  });
};
