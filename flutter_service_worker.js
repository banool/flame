'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';
const RESOURCES = {
  "icons/Icon-512.png": "57e9259701525432fe4c5b387756cf37",
"icons/Icon-192.png": "70d7d916a81b58a1856a761fea85e63b",
"favicon.png": "81272279ec86e161b1010d5a054d64b6",
"manifest.json": "88a09d3520ee1c1fd7ad820a705bfc83",
"index.html": "3870b610e0b17aa8f6f4d7bfc9ae11ec",
"/": "3870b610e0b17aa8f6f4d7bfc9ae11ec",
"assets/NOTICES": "869ff5b507a14792821467a24cd9923a",
"assets/fonts/MaterialIcons-Regular.otf": "1288c9e28052e028aba623321f7826ac",
"assets/AssetManifest.json": "5e278620cb1ff4ece47dad8454c59326",
"assets/assets/images/animations/chopper.json": "3a292092669b53cae0f334548a9641ee",
"assets/assets/images/animations/creature.png": "5e52950ac303c1b529e9005317459665",
"assets/assets/images/animations/chopper.png": "530485b0033f6debb146c0f2714126bb",
"assets/assets/images/tile_maps/selector.png": "952098264419a65b7ff4c8b655ca31b9",
"assets/assets/images/tile_maps/tiles.png": "31fa057544cc041e9e7ff94ab05ba444",
"assets/assets/images/nine-box.png": "42f7a8773200fd44ebc612a1677c378b",
"assets/assets/images/parallax/foreground-trees.png": "097b64262e32ef41a4790f419496efcc",
"assets/assets/images/parallax/mountains.png": "2da5aac8deab66c66347a8a4c099af99",
"assets/assets/images/parallax/mountain-far.png": "9c3b7ece9ddeec681c041dbecabab8ca",
"assets/assets/images/parallax/trees.png": "250c708291956aa10b61484940f1c0ab",
"assets/assets/images/parallax/bg.png": "0ec31e1a99ecb526afee996afa39dc08",
"assets/assets/images/shield.png": "305198a3a137aff47c4dad14a16ef731",
"assets/assets/images/boom.png": "3172e300cf7c040566fb873e001c706b",
"assets/assets/images/buttons.png": "687cad0e630d10a2dd4576bb9cefc76d",
"assets/assets/images/layers/enemy.png": "4ec6e5d783c40795a975802ca12d7096",
"assets/assets/images/layers/player.png": "fe28e301569a4e84a2090ad626d4498d",
"assets/assets/images/layers/background.png": "84139b28b82f7aac50a3ca347e613a80",
"assets/assets/images/flame.png": "f910f712d3a1faa6e001faae377aa72e",
"assets/assets/images/spritesheet.png": "9e133b5dee9f06d118d73189ff60d586",
"assets/assets/images/bomb_ptero.png": "5d8ecf64f191fbb3a3625eae665ce18a",
"assets/assets/images/joystick.png": "63d9ebbe96ee5bc90d30ace210a1daec",
"assets/assets/images/zap.png": "d57c02b537efae0396d30640470da7c9",
"assets/FontManifest.json": "7b2a36307916a9721811788013e65289",
"main.dart.js": "239c576e9f87f255c88d4cf44d1cb562",
"version.json": "7f6d59a811921bc56d56ddf95cf5d674"
};

// The application shell files that are downloaded before a service worker can
// start.
const CORE = [
  "/",
"main.dart.js",
"index.html",
"assets/NOTICES",
"assets/AssetManifest.json",
"assets/FontManifest.json"];
// During install, the TEMP cache is populated with the application shell files.
self.addEventListener("install", (event) => {
  self.skipWaiting();
  return event.waitUntil(
    caches.open(TEMP).then((cache) => {
      return cache.addAll(
        CORE.map((value) => new Request(value + '?revision=' + RESOURCES[value], {'cache': 'reload'})));
    })
  );
});

// During activate, the cache is populated with the temp files downloaded in
// install. If this service worker is upgrading from one with a saved
// MANIFEST, then use this to retain unchanged resource files.
self.addEventListener("activate", function(event) {
  return event.waitUntil(async function() {
    try {
      var contentCache = await caches.open(CACHE_NAME);
      var tempCache = await caches.open(TEMP);
      var manifestCache = await caches.open(MANIFEST);
      var manifest = await manifestCache.match('manifest');
      // When there is no prior manifest, clear the entire cache.
      if (!manifest) {
        await caches.delete(CACHE_NAME);
        contentCache = await caches.open(CACHE_NAME);
        for (var request of await tempCache.keys()) {
          var response = await tempCache.match(request);
          await contentCache.put(request, response);
        }
        await caches.delete(TEMP);
        // Save the manifest to make future upgrades efficient.
        await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
        return;
      }
      var oldManifest = await manifest.json();
      var origin = self.location.origin;
      for (var request of await contentCache.keys()) {
        var key = request.url.substring(origin.length + 1);
        if (key == "") {
          key = "/";
        }
        // If a resource from the old manifest is not in the new cache, or if
        // the MD5 sum has changed, delete it. Otherwise the resource is left
        // in the cache and can be reused by the new service worker.
        if (!RESOURCES[key] || RESOURCES[key] != oldManifest[key]) {
          await contentCache.delete(request);
        }
      }
      // Populate the cache with the app shell TEMP files, potentially overwriting
      // cache files preserved above.
      for (var request of await tempCache.keys()) {
        var response = await tempCache.match(request);
        await contentCache.put(request, response);
      }
      await caches.delete(TEMP);
      // Save the manifest to make future upgrades efficient.
      await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
      return;
    } catch (err) {
      // On an unhandled exception the state of the cache cannot be guaranteed.
      console.error('Failed to upgrade service worker: ' + err);
      await caches.delete(CACHE_NAME);
      await caches.delete(TEMP);
      await caches.delete(MANIFEST);
    }
  }());
});

// The fetch handler redirects requests for RESOURCE files to the service
// worker cache.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  var origin = self.location.origin;
  var key = event.request.url.substring(origin.length + 1);
  // Redirect URLs to the index.html
  if (key.indexOf('?v=') != -1) {
    key = key.split('?v=')[0];
  }
  if (event.request.url == origin || event.request.url.startsWith(origin + '/#') || key == '') {
    key = '/';
  }
  // If the URL is not the RESOURCE list then return to signal that the
  // browser should take over.
  if (!RESOURCES[key]) {
    return;
  }
  // If the URL is the index.html, perform an online-first request.
  if (key == '/') {
    return onlineFirst(event);
  }
  event.respondWith(caches.open(CACHE_NAME)
    .then((cache) =>  {
      return cache.match(event.request).then((response) => {
        // Either respond with the cached resource, or perform a fetch and
        // lazily populate the cache.
        return response || fetch(event.request).then((response) => {
          cache.put(event.request, response.clone());
          return response;
        });
      })
    })
  );
});

self.addEventListener('message', (event) => {
  // SkipWaiting can be used to immediately activate a waiting service worker.
  // This will also require a page refresh triggered by the main worker.
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
    return;
  }
  if (event.data === 'downloadOffline') {
    downloadOffline();
    return;
  }
});

// Download offline will check the RESOURCES for all files not in the cache
// and populate them.
async function downloadOffline() {
  var resources = [];
  var contentCache = await caches.open(CACHE_NAME);
  var currentContent = {};
  for (var request of await contentCache.keys()) {
    var key = request.url.substring(origin.length + 1);
    if (key == "") {
      key = "/";
    }
    currentContent[key] = true;
  }
  for (var resourceKey of Object.keys(RESOURCES)) {
    if (!currentContent[resourceKey]) {
      resources.push(resourceKey);
    }
  }
  return contentCache.addAll(resources);
}

// Attempt to download the resource online before falling back to
// the offline cache.
function onlineFirst(event) {
  return event.respondWith(
    fetch(event.request).then((response) => {
      return caches.open(CACHE_NAME).then((cache) => {
        cache.put(event.request, response.clone());
        return response;
      });
    }).catch((error) => {
      return caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response != null) {
            return response;
          }
          throw error;
        });
      });
    })
  );
}
