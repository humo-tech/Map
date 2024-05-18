<script setup>
import { ref, onMounted } from 'vue'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import csv2geojson from 'csv2geojson'
import { useRadar } from './useRadar'

const mapRef = ref(null)
const map = ref(null)

const apiKey =
  'v1.public.eyJqdGkiOiIyNDg1NDVhMi05YmE1LTRhNDgtYjRiMC1mOTE5NDU0NWViODYifaxbKAPbqsNmvLHiTfbKS_deE4bmKO7K_cZJYT6TRIw_Pn7ijG7i-lKIz4kFmZsaTWWWG4axhS0OZ7Zh1YSWFzlhjt1NeoQNgHl_wS4u5LKhIOzJD1cDRlG-c5ptLitkeQ_j5G3RZxWw2pVObaGnhldTqowIHRVZzobFItbVCriVEhiswNrULQ9HpmI4nFAWIrsTUAgLor_yAH8lJGuFFFeDGSD9S4jViBDc3fu_lpuv5ldvFxTQi9C8-9r5mzqO7cJ_r_-B1DqqbjOw6Og35JXg5kBZlXxCVjeTv3OXjg76QiEJp7XD1QvLWHp7PxVZDtkeGtOJrAT5MNDUpMT3eoc.YTAwN2QzYTQtMjA4OC00M2Q5LWE5ZTUtYjk4Y2U1YWUxY2Uy'
const mapName = 'OpenDataStandardLight'
const region = 'ap-northeast-1'
const { setRadar } = useRadar()

const apiEndPoint = 'https://7gd6dzwqumv6fpa62pn6nvwd240zdckd.lambda-url.ap-northeast-1.on.aws'

const markers = {}
let markersOnScreen = {}
const colors = ['#1196fc', '#fcf411']

// const showChart = (event) => {
//   const stationId = event.target.dataset.stationId
//   if (stationId) {
//     fetch(`${apiEndPoint}/bystation?station_id=${stationId}&hour=12`, { headers: { 'X-Api-Key': 'humo-tech' } })
//   }
// }

function updateMarkers() {
  const newMarkers = {}
  const features = map.value.querySourceFeatures('stations')

  // for every cluster on the screen, create an HTML marker for it (if we didn't yet),
  // and add it to the map if it's not there already
  for (const feature of features) {
    const coords = feature.geometry.coordinates
    const props = feature.properties
    const id = props.station_id || props.cluster_id

    let marker = markers[id]
    if (!marker) {
      const el = createDonutChart(props)
      marker = markers[id] = new maplibregl.Marker({
        element: el,
      }).setLngLat(coords)
      // el.addEventListener('click', showChart)
    }
    newMarkers[id] = marker

    if (!markersOnScreen[id]) marker.addTo(map.value)
  }
  // for every marker we've added previously, remove those that are no longer visible
  for (const id in markersOnScreen) {
    if (!newMarkers[id]) markersOnScreen[id].remove()
  }
  markersOnScreen = newMarkers
}

function createDonutChart(props) {
  const offsets = []
  const counts = [props.num_docks_available, props.num_bikes_available]
  let total = 0
  for (const count of counts) {
    offsets.push(total)
    total += count
  }
  // const r = total >= 1000 ? 50 : total >= 100 ? 32 : total >= 10 ? 24 : 18
  const r = Math.max(Math.sqrt(total) * 6, 20)
  const r0 = Math.round(r * 0.6)
  const w = r * 4

  let html = `<div data-station-id="${props.station_id}" class="marker">
<svg width="${w}" height="${w}"
  viewbox="0 0 ${w} ${w}"
  transform="translate(${w / 4}, ${w / 4})"
  text-anchor="middle" style="font: 16px sans-serif; display: block">`

  for (let i = 0; i < counts.length; i++) {
    html += donutSegment(offsets[i] / total, (offsets[i] + counts[i]) / total, r, r0, colors[i])
  }
  html += `<circle cx="${r}" cy="${r}" r="${r0}" fill="white" />
<text dominant-baseline="central" transform="translate(${r}, ${r})">
${props.num_docks_available ?? 0}台
</text>
</svg>
</div>`

  const el = document.createElement('div')
  el.innerHTML = html
  return el.firstChild
}

function donutSegment(start, end, r, r0, color) {
  if (end - start === 1) end -= 0.00001
  const a0 = 2 * Math.PI * (start - 0.25)
  const a1 = 2 * Math.PI * (end - 0.25)
  const x0 = Math.cos(a0)
  const y0 = Math.sin(a0)
  const x1 = Math.cos(a1)
  const y1 = Math.sin(a1)
  const largeArc = end - start > 0.5 ? 1 : 0

  // draw an SVG path
  return `<path d="M ${r + r0 * x0} ${r + r0 * y0} L ${r + r * x0} ${r + r * y0} A ${r} ${r} 0 ${largeArc} 1 ${
    r + r * x1
  } ${r + r * y1} L ${r + r0 * x1} ${r + r0 * y1} A ${r0} ${r0} 0 ${largeArc} 0 ${r + r0 * x0} ${
    r + r0 * y0
  }" fill="${color}" stroke="#ccc" />`
}

const getData = () => {
  return new Promise((resolve, reject) => {
    const bounds = map.value.getBounds()
    if (bounds.getEast() - bounds.getWest() > 0.07 || bounds.getNorth() - bounds.getSouth() > 0.07) {
      return
    }
    const boundsArray = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()]
    fetch(`${apiEndPoint}/latest_s3?bounds=${JSON.stringify(boundsArray)}`, { headers: { 'X-Api-Key': 'humo-tech' } })
      .then((res) => res.text())
      .then((text) => {
        csv2geojson.csv2geojson(
          text,
          {
            delimiter: '\t',
            latitude: 'lat',
            longitude: 'lon',
            numericFields: 'vehicle_capacity,num_docks_available,num_bikes_available,last_reported',
          },
          (err, data) => {
            if (err) {
              reject(new Error(err))
            } else {
              resolve(data)
            }
          }
        )
      })
  })
}

onMounted(() => {
  map.value = new maplibregl.Map({
    container: mapRef.value,
    center: [139.767, 35.71],
    style: `https://maps.geo.${region}.amazonaws.com/maps/v0/maps/${mapName}/style-descriptor?key=${apiKey}`,
    zoom: window.innerWidth < 800 ? 13 : 14,
    language: 'ja',
    hash: true,
  })
  map.value.addControl(
    new maplibregl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true,
      },
      trackUserLocation: false,
      showUserHeading: false,
    })
  )
  map.value.addControl(new maplibregl.NavigationControl())
  map.value.addControl(new maplibregl.ScaleControl())

  map.value.on('style.load', async () => {
    console.log(map.value.getStyle().layers.find((layer) => layer.type === 'symbol'))
    // map.value.setConfigProperty('basemap', 'lightPreset', 'dusk')
    map.value.addLayer({
      id: 'dark',
      type: 'background',
      paint: {
        'background-color': '#000',
        'background-opacity': 0.6,
      },
    })
    map.value.addSource('stations', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
      cluster: false,
      clusterRadius: 30,
      clusterProperties: {
        num_docks_available: ['+', ['get', 'num_docks_available']],
        num_bikes_available: ['+', ['get', 'num_bikes_available']],
      },
    })

    map.value.addLayer({
      id: 'station_label',
      type: 'symbol',
      source: 'stations',
    })

    try {
      const data = await getData()
      map.value.getSource('stations').setData(data)
    } catch (e) {
      console.log(e)
    }
    setRadar(map.value)
  })

  map.value.on('render', () => {
    if (!map.value.getSource('stations') || !map.value.isSourceLoaded('stations')) return
    updateMarkers()
  })

  map.value.on('moveend', async () => {
    const data = await getData()
    map.value.getSource('stations').setData(data)
  })
})
</script>

<template>
  <div ref="mapRef" class="map"></div>
  <div class="legend">
    <ul>
      <li>駐輪可能</li>
      <li>貸出可能</li>
    </ul>
    <div class="memo">※ 数字は駐輪可能台数</div>
  </div>
</template>

<style scoped>
.map {
  width: 100%;
  height: 100%;
}
.legend {
  border: 1px solid #999;
  border-radius: 5px;
  background-color: #000;
  color: #fff;
  position: absolute;
  bottom: 40px;
  right: 10px;
  z-index: 2;
  padding: 10px;
}
.legend ul {
  padding: 0px;
  margin: 5px;
  list-style-type: none;
  padding-bottom: 5px;
}
.legend ul li::before {
  content: '';
  display: inline-block;
  width: 0.9em;
  height: 0.9em;
  border-radius: 20%;
  border: 1px solid #999;
  margin-right: 5px;
  position: relative;
  top: 1px;
}
.legend ul li:nth-child(1)::before {
  background-color: v-bind(colors[0]);
}
.legend ul li:nth-child(2)::before {
  background-color: v-bind(colors[1]);
}
.memo {
  font-size: 10px;
  color: #aaa;
}
</style>
<style>
.marker * {
  pointer-events: none !important;
}
</style>
