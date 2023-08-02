// @ts-check

// @TODO: Future improvements:
// - remove 'unsafe-inline' style by precomputing theme hash
// - add report-uri to gather errors if anything was missed

const extensionCsp = {
  dappFrameAncestors: `
    'self'
    https:
    http://localhost:*
    http://127.0.0.1:*
  `,
  hmrWebsocket: `
    ws://localhost:2222
  `,
}

// Keep synced with deployment
const getCsp = ({ isExtension } = { isExtension: false }) =>
  `
    default-src 'none';
    script-src
      'self'
      'report-sample';
    style-src
      'self'
      'unsafe-inline'
      'report-sample';
    font-src
      'self';
    connect-src
      'self'
      https://grpc.oasis.dev
      https://testnet.grpc.oasis.dev
      https://api.oasisscan.com
      https://monitor.oasis.dev
      ${isExtension ? extensionCsp.hmrWebsocket : ''}
      ;
    frame-ancestors
      ${isExtension ? extensionCsp.dappFrameAncestors : `'none'`};
    frame-src
      https://global.transak.com
      https://global-stg.transak.com;
    img-src 'self' data: https:;
    base-uri 'self';
    manifest-src 'self';
  `
    .trim()
    .split('\n')
    .map(line => line.trim())
    .filter(line => !!line)
    .join(' ')
    .replace(/ ;/g, ';')

// Generated with https://www.permissionspolicy.com/
const getPermissionsPolicy = () =>
  `
    accelerometer=("https://api.sardine.ai"),
    ambient-light-sensor=(),
    autoplay=(),
    bluetooth=(self),
    camera=("https://global.transak.com" "https://global-stg.transak.com"),
    cross-origin-isolated=(),
    display-capture=(),
    document-domain=(),
    encrypted-media=(),
    execution-while-not-rendered=(),
    execution-while-out-of-viewport=(),
    fullscreen=(self "https://global.transak.com" "https://global-stg.transak.com"),
    geolocation=(),
    gyroscope=("https://api.sardine.ai"),
    keyboard-map=(),
    magnetometer=(),
    microphone=("https://global.transak.com" "https://global-stg.transak.com"),
    midi=(),
    navigation-override=(),
    payment=("https://global.transak.com" "https://global-stg.transak.com"),
    picture-in-picture=(),
    publickey-credentials-get=(),
    screen-wake-lock=(),
    sync-xhr=(),
    usb=(self),
    web-share=(),
    xr-spatial-tracking=()
  `
    .trim()
    .split('\n')
    .map(line => line.trim())
    .filter(line => !!line)
    .join(' ')
    .replace(/ ,/g, ',')

module.exports = { getCsp, getPermissionsPolicy }
