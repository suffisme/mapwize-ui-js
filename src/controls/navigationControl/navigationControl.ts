import * as $ from 'jquery'
import { defaults } from 'lodash'

import { uiConfig } from '../../config'
import { translate } from '../../translate'

type Options = {
  showCompass?: boolean,
  showZoom?: boolean,
  visualizePitch?: boolean,
}

const defaultOptions: Options = {
  showCompass: true,
  showZoom: true,
  visualizePitch: true,
}

class NavigationControl {
  private _map: any
  private options: Options
  private _container: HTMLElement
  private _zoomInButton: HTMLElement
  private _zoomOutButton: HTMLElement
  private _compass: HTMLElement
  private _compassArrow: HTMLElement

  constructor (options: Options) {
    this.options = defaults(options, defaultOptions)

    this._container = document.createElement('div')
    this._container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group mwz-ctrl-navigation'

    if (this.options.showZoom) {
      this._zoomInButton = this._createButton('mapboxgl-ctrl-icon mapboxgl-ctrl-zoom-in', '+', (e) => this._map.zoomIn({}, { originalEvent: e }))
      this._zoomOutButton = this._createButton('mapboxgl-ctrl-icon mapboxgl-ctrl-zoom-out', '-', (e) => this._map.zoomOut({}, { originalEvent: e }))
    }

    if (this.options.showCompass) {
      this._compass = this._createButton('mapboxgl-ctrl-icon mapboxgl-ctrl-compass', '', (e) => {
        if (this.options.visualizePitch) {
          this._map.resetNorthPitch({}, { originalEvent: e })
        } else {
          this._map.resetNorth({}, { originalEvent: e })
        }
      })

      this._compassArrow = document.createElement('span')
      this._compassArrow.className = 'mapboxgl-ctrl-compass-arrow'
      this._compass.appendChild(this._compassArrow)
    }
  }

  public refreshLocale () {
    if (!$(this._map._container).hasClass(uiConfig.SMALL_SCREEN_CLASS)) {
      setTimeout(() => {
        const container = $(this._container)
        container.find('.mapboxgl-ctrl-zoom-in').attr('data-original-title', translate('zoom_in'))
        container.find('.mapboxgl-ctrl-zoom-out').attr('data-original-title', translate('zoom_out'))
        container.find('.mapboxgl-ctrl-compass').attr('data-original-title', translate('reset_bearing_to_north') + '<br>' + translate('use_ctrl'))
        container.find('[data-toggle="tooltip"]').tooltip({ trigger: 'hover' })
      }, 1000)
    }
  }

  public onAdd (map: any) {
    this._map = map

    if (this.options.showZoom) {
      this._onZoomChange = this._onZoomChange.bind(this)
      this._map.on('zoom', this._onZoomChange)
      this._onZoomChange()
    }
    if (this.options.showCompass) {
      this._onBearingChange = this._onBearingChange.bind(this)
      if (this.options.visualizePitch) {
        this._map.on('pitch', this._onBearingChange)
      }
      this._map.on('rotate', this._onBearingChange)
      this._onBearingChange()
    }

    this.refreshLocale()
    return this._container
  }

  public onRemove () {
    this._container.parentNode.removeChild(this._container)

    if (this.options.showZoom) {
      this._map.off('zoom', this._onZoomChange)
    }
    if (this.options.showCompass) {
      this._map.off('rotate', this._onBearingChange)
      if (this.options.visualizePitch) {
        this._map.off('pitch', this._onBearingChange)
      }
    }
    this._map = undefined
  }

  private _onZoomChange () {
    this._updateZoomButtons()
  }
  private _onBearingChange () {
    this._rotateCompassArrow()
  }

  private _rotateCompassArrow () {
    const rotate = this.options.visualizePitch ?
      `scale(${1 / Math.pow(Math.cos(this._map.transform.pitch * (Math.PI / 180)), 0.5)}) rotateX(${this._map.transform.pitch}deg) rotateZ(${this._map.transform.angle * (180 / Math.PI)}deg)` :
      `rotate(${this._map.transform.angle * (180 / Math.PI)}deg)`

    this._compassArrow.style.transform = rotate
  }

  private _updateZoomButtons () {
    const zoom = this._map.getZoom()
    if (zoom === this._map.getMaxZoom()) {
      this._zoomInButton.classList.add('mapboxgl-ctrl-icon-disabled')
    } else {
      this._zoomInButton.classList.remove('mapboxgl-ctrl-icon-disabled')
    }
    if (zoom === this._map.getMinZoom()) {
      this._zoomOutButton.classList.add('mapboxgl-ctrl-icon-disabled')
    } else {
      this._zoomOutButton.classList.remove('mapboxgl-ctrl-icon-disabled')
    }
  }

  private _createButton (className: string, html: string, fn: (e: any) => any) {
    const a = document.createElement('button')
    a.className = className
    a.type = 'button'
    a.innerHTML = html
    a.setAttribute('data-toggle', 'tooltip')
    a.setAttribute('data-placement', 'left')
    a.setAttribute('data-html', 'true')
    a.addEventListener('click', fn)
    this._container.appendChild(a)
    return a
  }
}

export default NavigationControl
