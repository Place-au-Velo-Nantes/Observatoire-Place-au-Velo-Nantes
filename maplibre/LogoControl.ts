export default class LogoControl {
  _container!: HTMLDivElement;
  _image!: HTMLImageElement;
  _src: string;
  _alt: string;
  _width: number;
  _height: number;

  constructor({ src, alt, width, height }: { src: string; alt: string; width: number; height: number }) {
    this._src = src;
    this._alt = alt;
    this._width = width;
    this._height = height;
  }

  onAdd() {
    this._container = document.createElement('div');
    this._container.className = 'maplibregl-logo-control maplibregl-ctrl';

    this._image = document.createElement('img');
    this._image.src = this._src;
    this._image.alt = this._alt;
    this._image.width = this._width;
    this._image.height = this._height;
    this._image.decoding = 'async';
    this._image.draggable = false;
    this._image.style.userSelect = 'none';

    // on click, go to the logo's website in a new tab
    this._image.style.cursor = 'pointer';
    this._image.onclick = () => {
      window.open('https://lavilleavelo.org/', '_blank');
    };

    const tooltip = document.createElement('div');
    tooltip.className = '_tooltip my-0';
    tooltip.appendChild(this._image);

    const textWrapper = document.createElement('div');

    const title = document.createElement('div');
    title.textContent = 'Retours, questions ?';

    const linkContainer = document.createElement('div');
    const link = document.createElement('a');
    link.href = 'mailto:observatoire@placeauvelo-nantes.fr';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'contactez-nous';
    linkContainer.appendChild(link);

    textWrapper.appendChild(title);
    textWrapper.appendChild(linkContainer);
    tooltip.appendChild(textWrapper);

    this._container.appendChild(tooltip);

    this._container.style.margin = '0';

    return this._container;
  }

  onRemove() {
    if (this._container && this._container.parentNode) {
      this._container.parentNode.removeChild(this._container);
    }
  }
}
