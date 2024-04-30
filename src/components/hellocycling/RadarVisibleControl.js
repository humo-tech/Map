export class RadarVisibleControl {
  constructor(layerName) {
    this.layerName = layerName
    this.visible = true
  }

  toggleLayer() {
    this.visible = !this.visible
    this.map.setLayoutProperty(this.layerName, 'visibility', this.visible ? 'visible' : 'none')

    this.button.style.opacity = this.visible ? 1.0 : 0.5
  }

  onAdd(map) {
    this.map = map

    this.button = document.createElement('button')
    this.button.innerHTML = '☔'
    this.button.addEventListener('click', (e) => {
      this.toggleLayer()
    })

    this.container = document.createElement('div')
    this.container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group'
    this.container.appendChild(this.button)

    return this.container
  }

  onRemove() {
    this.container.parentNode.removeChild(this.container)
    this.map = undefined
  }
}
