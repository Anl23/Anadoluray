function updateLineContentHeight(content){

    if(content?.classList.contains("active") && content.style.maxHeight !== "none"){
        content.style.maxHeight = `${content.scrollHeight + 40}px`;
    }

}

function allowLineContentToGrow(content){

    if(content?.classList.contains("active")){
        content.style.maxHeight = "none";
    }

}

function openLine(element){

    const content = element.nextElementSibling;

    if(!content){
        return;
    }

    const isOpen = content.classList.contains("active");
    content.classList.toggle("active", !isOpen);
    element.classList.toggle("active", !isOpen);
    element.setAttribute("aria-expanded", String(!isOpen));

    if(content.classList.contains("active")){
        const releaseMaxHeight = event=>{
            if(event.target !== content || event.propertyName !== "max-height"){
                return;
            }

            content.removeEventListener("transitionend", releaseMaxHeight);
            if(content.classList.contains("active")){
                content.style.maxHeight = "none";
            }
        };
        content.addEventListener("transitionend", releaseMaxHeight);
        updateLineContentHeight(content);
        content.style.opacity = "1";
        window.dispatchEvent(new CustomEvent("line-content-opened", {
            detail: content
        }));
    }else{
        content.style.maxHeight = "0px";
        content.style.opacity = "0";
    }

}

const searchLineMatch = window.location.hash.match(/^#search-line-(\d+)$/);

if(searchLineMatch){
    const targetLine = document.querySelectorAll(".line")[Number(searchLineMatch[1])];
    const targetTitle = targetLine?.querySelector(":scope > .line-title");

    if(targetLine && targetTitle){
        if(targetTitle.getAttribute("aria-expanded") !== "true" &&
            !targetTitle.classList.contains("active")){
            openLine(targetTitle);
        }

        targetLine.style.scrollMarginTop = "80px";
        targetLine.scrollIntoView({ behavior: "smooth", block: "start" });
    }
}

function getRemainingText(targetDate){

    const now = new Date();
    const target = new Date(targetDate);
    const difference = target - now;

    if(difference <= 0){
        return [{ text: "Açıldı" }];
    }

    let years = target.getFullYear() - now.getFullYear();
    let months = target.getMonth() - now.getMonth();
    let days = target.getDate() - now.getDate();

    if(days < 0){
        const previousMonth = new Date(target.getFullYear(), target.getMonth(), 0);
        const daysInPreviousMonth = previousMonth.getDate();
        days += daysInPreviousMonth;
        months -= 1;
    }

    if(months < 0){
        years -= 1;
        months += 12;
    }

    const parts = [];

    if(years > 0){
        parts.push(`${years} ${years === 1 ? "yıl" : "yıl"}`);
    }

    if(months > 0){
        parts.push(`${months} ${months === 1 ? "ay" : "ay"}`);
    }

    if(days > 0){
        parts.push(`${days} ${days === 1 ? "gün" : "gün"}`);
    }

    if(parts.length === 0){
        return [{ text: "Bugün" }];
    }

    return parts.map((text, index) => ({
        text,
        isDays: index === parts.length - 1 && days > 0
    }));

}

function updateCountdowns(){

    const items = document.querySelectorAll(".completion-item[data-target]");

    items.forEach(item => {
        const dateNode = item.querySelector(".completion-date");

        if(!dateNode){
            return;
        }

        const targetDate = item.dataset.target;
        dateNode.replaceChildren();
        getRemainingText(targetDate).forEach((part, index) => {
            if(index > 0){
                dateNode.append(" ");
            }

            if(part.isDays){
                const daysNode = document.createElement("strong");
                daysNode.className = "completion-days";
                daysNode.textContent = part.text;
                dateNode.append(daysNode);
            }else{
                dateNode.append(part.text);
            }
        });
    });

}

updateCountdowns();
setInterval(updateCountdowns, 60000);

let leafletLoadPromise;
let mapLibreLayerPromise;
const routeDataCache = new Map();
const routeMaps = new WeakMap();
const routeMapBounds = new WeakMap();

function getOsmRouteName(route){

    const title = route.closest(".line")?.querySelector(".line-title");

    if(!title){
        return "Raylı sistem güzergâhı";
    }

    const cleanTitle = title.cloneNode(true);
    cleanTitle.querySelectorAll("img, .line-status").forEach(element => element.remove());
    return cleanTitle.textContent.trim().replace(/\s+/g, " ");
}

function loadLeaflet(){

    if(window.L){
        return Promise.resolve(window.L);
    }

    if(leafletLoadPromise){
        return leafletLoadPromise;
    }

    const leafletCss = document.createElement("link");
    leafletCss.rel = "stylesheet";
    leafletCss.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.append(leafletCss);

    leafletLoadPromise = new Promise((resolve, reject)=>{
        const leafletScript = document.createElement("script");
        leafletScript.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        leafletScript.onload = ()=>resolve(window.L);
        leafletScript.onerror = ()=>reject(new Error("Leaflet harita kütüphanesi yüklenemedi."));
        document.head.append(leafletScript);
    });

    return leafletLoadPromise;

}

function loadMapLibreLayer(){

    if(window.MaplibreGLLeaflet?.maplibreGL){
        return Promise.resolve(window.MaplibreGLLeaflet.maplibreGL);
    }

    if(mapLibreLayerPromise){
        return mapLibreLayerPromise;
    }

    const mapLibreCss = document.createElement("link");
    mapLibreCss.rel = "stylesheet";
    mapLibreCss.href = "https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css";
    mapLibreLayerPromise = new Promise((resolve, reject)=>{
        mapLibreCss.onload = resolve;
        mapLibreCss.onerror = ()=>reject(new Error("MapLibre GL stilleri yüklenemedi."));
        document.head.append(mapLibreCss);
    }).then(()=>new Promise((resolve, reject)=>{
        const mapLibreScript = document.createElement("script");
        mapLibreScript.src = "https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js";
        mapLibreScript.onload = ()=>{
            const leafletAdapterScript = document.createElement("script");
            leafletAdapterScript.src = "https://unpkg.com/@maplibre/maplibre-gl-leaflet@0.1.4/leaflet-maplibre-gl.js";
            leafletAdapterScript.onload = ()=>{
                const maplibreGL = window.MaplibreGLLeaflet?.maplibreGL;
                if(!maplibreGL){
                    reject(new Error("MapLibre Leaflet bağdaştırıcısı yüklenemedi."));
                    return;
                }
                resolve(maplibreGL);
            };
            leafletAdapterScript.onerror = ()=>reject(new Error("MapLibre Leaflet bağdaştırıcısı yüklenemedi."));
            document.head.append(leafletAdapterScript);
        };
        mapLibreScript.onerror = ()=>reject(new Error("MapLibre GL kütüphanesi yüklenemedi."));
        document.head.append(mapLibreScript);
    }));

    return mapLibreLayerPromise;

}

async function addDarkMapLayer(map){

    const maplibreGL = await loadMapLibreLayer();
    maplibreGL({
        style: "https://tiles.openfreemap.org/styles/dark"
    }).addTo(map);

}

function getOsmRouteIds(route){

    const listedIds = route.dataset.osmIds;
    const entries = listedIds
        ? listedIds.split(",").map(value => value.trim()).filter(Boolean)
        : [route.dataset.osmId].filter(Boolean);

    return entries.map(entry => {
        const [type, id] = entry.includes(":")
            ? entry.split(":", 2)
            : [route.dataset.osmType || "", entry];
        return { type, id };
    });

}

function deduplicateOsmStations(stations){

    const uniqueStations = [];

    stations.forEach(station => {
        const normalizedName = station.name.trim().toLocaleLowerCase("tr-TR");
        const isDuplicate = uniqueStations.some(existing => {
            if(existing.normalizedName !== normalizedName){
                return false;
            }

            const latitudeDifference = (existing.coordinates[0] - station.coordinates[0]) * 111320;
            const longitudeDifference = (existing.coordinates[1] - station.coordinates[1]) *
                111320 * Math.cos(station.coordinates[0] * Math.PI / 180);
            return Math.hypot(latitudeDifference, longitudeDifference) < 120;
        });

        if(!isDuplicate){
            uniqueStations.push({
                ...station,
                normalizedName
            });
        }
    });

    return uniqueStations.map(({ name, coordinates }) => ({ name, coordinates }));

}

function getOsmStations(elements){

    const stationTypes = {
        public_transport: ["station", "stop_position", "platform"],
        railway: ["station", "halt", "tram_stop", "stop", "platform"]
    };
    const stationMemberIds = new Set(
        elements.flatMap(element => element.type === "relation"
            ? (element.members || [])
                .filter(member => /(?:^|_)(?:stop|station)(?:_|$)/i.test(member.role))
                .map(member => `${member.type}/${member.ref}`)
            : [])
    );
    const hasStationMembers = stationMemberIds.size > 0;
    const nodeCoordinates = new Map(
        elements
            .filter(element => element.type === "node" &&
                Number.isFinite(element.lat) && Number.isFinite(element.lon))
            .map(node => [node.id, [node.lat, node.lon]])
    );
    const stations = elements.flatMap(element => {
        if(!["node", "way"].includes(element.type)){
            return [];
        }

        const tags = element.tags || {};
        const isStation = hasStationMembers
            ? stationMemberIds.has(`${element.type}/${element.id}`)
            : Object.entries(stationTypes).some(([tag, values]) => values.includes(tags[tag]));
        const name = tags.name || tags["name:tr"];

        if(!isStation || !name){
            return [];
        }

        let coordinates;
        if(element.type === "node" && Number.isFinite(element.lat) && Number.isFinite(element.lon)){
            coordinates = [element.lat, element.lon];
        }else if(element.type === "way"){
            const points = element.geometry
                ? element.geometry.map(point => [point.lat, point.lon])
                : element.nodes?.map(nodeId => nodeCoordinates.get(nodeId)).filter(Boolean) || [];

            if(points.length){
                coordinates = points.reduce((total, point) => [
                    total[0] + point[0] / points.length,
                    total[1] + point[1] / points.length
                ], [0, 0]);
            }
        }

        return coordinates ? [{ name, coordinates }] : [];
    });

    return deduplicateOsmStations(stations);

}

async function fetchOsmRouteId(osmId, osmType = ""){
    const id = osmId ? Number(osmId) : 0;
    if(osmId && (!Number.isSafeInteger(id) || id <= 0)){
        throw new Error(`Geçersiz OpenStreetMap kimliği: ${osmId}`);
    }

    if(osmType && !["relation", "way"].includes(osmType)){
        throw new Error(`Geçersiz OpenStreetMap nesne türü: ${osmType}`);
    }

    const cacheKey = `${osmType || "auto"}:${id}`;
    if(routeDataCache.has(cacheKey)){
        return routeDataCache.get(cacheKey);
    }

    const endpoints = (osmType ? [osmType] : ["relation", "way"]).map(type =>
        `https://api.openstreetmap.org/api/0.6/${type}/${id}/full.json`
    );
    let lastError;

    for(const endpoint of endpoints){
        try{
            const response = await fetch(endpoint);

            if(!response.ok){
                throw new Error(`OpenStreetMap sorgusu başarısız oldu (${response.status}).`);
            }

            const data = await response.json();
            const elements = data.elements || [];
            const nodes = new Map(
                elements
                    .filter(element => element.type === "node")
                    .map(node => [node.id, [node.lat, node.lon]])
            );
            const ways = elements.flatMap(element => {
                if(element.type === "way"){
                    return [element];
                }

                return element.type === "relation"
                    ? (element.members || [])
                        .filter(member => member.type === "way")
                        .map(member => elements.find(candidate =>
                            candidate.type === "way" && candidate.id === member.ref
                        ))
                        .filter(Boolean)
                    : [];
            });
            const segments = ways
                .map(way => (way.geometry || way.nodes?.map(nodeId => nodes.get(nodeId)) || [])
                    .filter(Boolean))
                .filter(segment => segment.length > 1);

            if(segments.length === 0){
                throw new Error(`OSM ${id} kimliği güzergâh vektörü içermiyor.`);
            }

            const routeData = {
                segments,
                stations: getOsmStations(elements)
            };
            routeDataCache.set(cacheKey, routeData);
            return routeData;
        }catch(error){
            lastError = error;
        }
    }

    throw lastError || new Error("OpenStreetMap güzergâhı alınamadı.");
}

async function fetchOsmRoute(route){
    const routeIds = getOsmRouteIds(route);
    const routeData = await Promise.all(
        routeIds.map(({ id, type }) => fetchOsmRouteId(id, type))
    );
    return {
        segments: routeData.flatMap(data => data.segments),
        stations: deduplicateOsmStations(routeData.flatMap(data => data.stations))
    };
}

async function initializeOsmRoute(route){

    if(!route.dataset.osmId.trim()){
        return;
    }

    if(routeMaps.has(route)){
        routeMaps.get(route).invalidateSize();
        return;
    }

    const routeName = getOsmRouteName(route);
    try{
        const [leaflet, routeData] = await Promise.all([
            loadLeaflet(),
            fetchOsmRoute(route)
        ]);
        const { segments, stations } = routeData;

        if(segments.length === 0){
            throw new Error(`OSM ${route.dataset.osmId} kimliği güzergâh verisi içermiyor.`);
        }

        const mapElement = document.createElement("div");
        mapElement.className = "osm-route-map";
        mapElement.setAttribute("role", "region");
        mapElement.setAttribute("aria-label", `${routeName} interaktif harita`);
        route.append(mapElement);
        allowLineContentToGrow(route.closest(".line-content"));

        const map = leaflet.map(mapElement, { scrollWheelZoom: true })
            .setView([40.98, 29.12], 10);
        await addDarkMapLayer(map);

        const color = route.dataset.osmColor || "#e91977";
        const routeLines = leaflet.featureGroup(
            segments.map(coordinates => leaflet.polyline(coordinates, {
                color,
                weight: 5,
                opacity: 0.9
            }))
        ).addTo(map);
        stations.forEach(station => {
            const popup = document.createElement("span");
            popup.textContent = station.name;
            leaflet.circleMarker(station.coordinates, {
                radius: 5,
                color,
                weight: 2,
                fillColor: "#ffffff",
                fillOpacity: 1
            }).bindPopup(popup).addTo(map);
        });

        const bounds = routeLines.getBounds();
        map.fitBounds(bounds, { padding: [20, 20] });
        routeMapBounds.set(map, bounds);

        const expandControl = leaflet.control({ position: "topleft" });
        expandControl.onAdd = ()=>{
            const button = leaflet.DomUtil.create("button", "leaflet-bar osm-map-expand");
            button.type = "button";
            button.textContent = "⛶";
            button.title = "Haritayı büyüt";
            button.setAttribute("aria-label", "Haritayı büyüt");
            leaflet.DomEvent.disableClickPropagation(button);
            leaflet.DomEvent.on(button, "click", event=>{
                leaflet.DomEvent.stop(event);
                openExpandedMap(mapElement, map, button);
            });
            return button;
        };
        expandControl.addTo(map);

        routeMaps.set(route, map);
        window.requestAnimationFrame(()=>{
            updateLineContentHeight(route.closest(".line-content"));
        });
        window.setTimeout(()=>{
            map.invalidateSize();
            updateLineContentHeight(route.closest(".line-content"));
        }, 300);
    }catch(error){
        const errorMessage = document.createElement("p");
        errorMessage.className = "osm-map-error";
        errorMessage.textContent = "Güzergâh haritası yüklenemedi.";
        route.replaceChildren(errorMessage);
        updateLineContentHeight(route.closest(".line-content"));
        console.warn(`OSM güzergâhı yüklenemedi (${routeName}).`, error);
    }
}

function openExpandedMap(mapElement, map, expandButton){

    const originalParent = mapElement.parentElement;
    const originalNextSibling = mapElement.nextElementSibling;
    const bounds = routeMapBounds.get(map);
    const sidebar = document.querySelector(".sidebar");
    const wasDesktopSidebarCollapsed = document.body.classList.contains("desktop-sidebar-collapsed");
    const wasMobileSidebarOpen = sidebar?.classList.contains("active") || false;

    if(window.innerWidth > 768){
        document.body.classList.add("desktop-sidebar-collapsed");
    }else if(sidebar){
        sidebar.classList.remove("active");
        document.body.classList.remove("sidebar-open");
    }

    const overlay = document.createElement("div");
    overlay.className = "osm-map-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Genişletilmiş güzergâh haritası");

    const closeButton = document.createElement("button");
    closeButton.className = "osm-map-close";
    closeButton.type = "button";
    closeButton.textContent = "Haritayı kapat";
    closeButton.addEventListener("click", closeExpandedMap);
    overlay.append(closeButton, mapElement);
    document.body.append(overlay);

    mapElement.classList.add("osm-route-map--expanded");
    expandButton.setAttribute("aria-label", "Haritayı küçült");
    expandButton.title = "Haritayı küçült";

    function closeExpandedMap(){
        mapElement.classList.remove("osm-route-map--expanded");
        expandButton.setAttribute("aria-label", "Haritayı büyüt");
        expandButton.title = "Haritayı büyüt";
        if(originalNextSibling?.parentElement === originalParent){
            originalParent.insertBefore(mapElement, originalNextSibling);
        }else{
            originalParent.append(mapElement);
        }
        overlay.remove();
        if(window.innerWidth > 768){
            document.body.classList.toggle("desktop-sidebar-collapsed", wasDesktopSidebarCollapsed);
        }else if(sidebar && wasMobileSidebarOpen){
            sidebar.classList.add("active");
            document.body.classList.add("sidebar-open");
        }
        window.removeEventListener("keydown", handleEscape);
        map.invalidateSize();
    }

    function handleEscape(event){
        if(event.key === "Escape"){
            closeExpandedMap();
        }
    }

    overlay.addEventListener("click", event=>{
        if(event.target === overlay){
            closeExpandedMap();
        }
    });
    window.addEventListener("keydown", handleEscape);
    closeButton.focus();
    window.setTimeout(()=>{
        map.invalidateSize();
        if(bounds){
            map.fitBounds(bounds, { padding: [60, 60] });
        }
    }, 100);
}

window.addEventListener("line-content-opened", event=>{
    const content = event.detail;

    window.setTimeout(()=>{
        content.querySelectorAll('.route[data-osm-id]:not([data-osm-id=""])').forEach(initializeOsmRoute);
    }, 350);
});

async function initializeVisionMap(){

    const mapElement = document.querySelector("#vision-map");

    if(!mapElement){
        return;
    }

    const status = document.querySelector("#vision-map-status");
    const legend = document.querySelector("#vision-map-legend");
    const pages = ["isletmede.html", "insa.html", "proje.html", "fizibilite.html", "iptal.html"];

    try{
        const [leaflet, pageResponses] = await Promise.all([
            loadLeaflet(),
            Promise.all(pages.map(async page=>{
                const response = await fetch(page);
                if(!response.ok){
                    throw new Error(`${page} yüklenemedi (${response.status}).`);
                }
                return { page, html: await response.text() };
            }))
        ]);
        const map = leaflet.map(mapElement, { scrollWheelZoom: true })
            .setView([40.98, 29.12], 10);
        await addDarkMapLayer(map);
        const routes = [];
        const seenIds = new Set();
        const legendedLines = new Set();

        pageResponses.forEach(({ page, html })=>{
            const pageDocument = new DOMParser().parseFromString(html, "text/html");
            const lines = [...pageDocument.querySelectorAll(".line")];

            lines.forEach((line, lineIndex)=>{
                const route = line.querySelector(".route[data-osm-id]");
                if(!route){
                    return;
                }

                const title = getOsmRouteName(route);
                const osmIds = getOsmRouteIds(route);
                if(!osmIds.length || !osmIds.some(({ id }) => id.trim())){
                    return;
                }

                osmIds.forEach(({ id, type })=>{
                    const key = `${type || "auto"}:${id}`;
                    if(seenIds.has(key)){
                        return;
                    }

                    seenIds.add(key);
                    routes.push({
                        route,
                        id,
                        type,
                        title,
                        color: route.dataset.osmColor || "#65656a",
                        href: `${page}#search-line-${lineIndex}`
                    });
                });
            });
        });

        const renderedRoutes = [];
        const failedRoutes = [];

        for(const route of routes){
            try{
                const routeData = await fetchOsmRouteId(route.id, route.type);
                const lineLayers = routeData.segments.map(coordinates => leaflet.polyline(coordinates, {
                    color: route.color,
                    weight: 5,
                    opacity: 0.9
                }));
                const group = leaflet.featureGroup(lineLayers).addTo(map);
                routeData.stations.forEach(station => {
                    const popup = document.createElement("span");
                    popup.textContent = station.name;
                    leaflet.circleMarker(station.coordinates, {
                        radius: 5,
                        color: route.color,
                        weight: 2,
                        fillColor: "#ffffff",
                        fillOpacity: 1
                    }).bindPopup(popup).addTo(map);
                });
                const popupLink = document.createElement("a");
                popupLink.className = "vision-map-popup-link";
                popupLink.href = route.href;
                popupLink.textContent = route.title;
                group.bindPopup(popupLink);
                renderedRoutes.push({ ...route, group });

                if(!legendedLines.has(route.href)){
                    const legendItem = document.createElement("a");
                    legendItem.className = "vision-map-legend-item";
                    legendItem.href = route.href;
                    const swatch = document.createElement("span");
                    swatch.className = "vision-map-legend-color";
                    swatch.style.backgroundColor = route.color;
                    legendItem.append(swatch, document.createTextNode(route.title));
                    legend.append(legendItem);
                    legendedLines.add(route.href);
                }
            }catch(error){
                failedRoutes.push(route.title);
                console.warn(`Vizyon haritası güzergâhı yüklenemedi (${route.title}, OSM ${route.id}).`, error);
            }
        }

        if(renderedRoutes.length){
            const allRoutes = leaflet.featureGroup(renderedRoutes.map(route => route.group));
            const bounds = allRoutes.getBounds();
            map.fitBounds(bounds, { padding: [28, 28] });
            routeMapBounds.set(map, bounds);
        }else{
            map.setView([40.98, 29.12], 10);
        }

        const expandControl = leaflet.control({ position: "topleft" });
        expandControl.onAdd = ()=>{
            const button = leaflet.DomUtil.create("button", "leaflet-bar osm-map-expand");
            button.type = "button";
            button.textContent = "⛶";
            button.title = "Haritayı büyüt";
            button.setAttribute("aria-label", "Haritayı büyüt");
            leaflet.DomEvent.disableClickPropagation(button);
            leaflet.DomEvent.on(button, "click", event=>{
                leaflet.DomEvent.stop(event);
                openExpandedMap(mapElement, map, button);
            });
            return button;
        };
        expandControl.addTo(map);

        status.textContent = `Haritada ${renderedRoutes.length} hat gösteriliyor.`;
        if(failedRoutes.length){
            const failedMessage = document.createElement("p");
            failedMessage.textContent = `Haritada yüklenemeyen hatlar: ${failedRoutes.join(", ")}.`;
            status.append(failedMessage);
        }
        window.setTimeout(()=>map.invalidateSize(), 300);
    }catch(error){
        status.textContent = "Vizyon haritası yüklenemedi. Sayfayı HTTP/HTTPS üzerinden açıp yeniden deneyin.";
        console.error("Vizyon haritası başlatılamadı.", error);
    }
}

initializeVisionMap();

// Hamburger menü

const menuToggle = document.querySelector(".menu-toggle");
const sidebar = document.querySelector(".sidebar");
const sidebarCollapse = document.querySelector(".sidebar-collapse");


if(menuToggle && sidebar){

    const syncSidebarState = () => {
        document.body.classList.toggle("sidebar-open", sidebar.classList.contains("active"));
    };

    menuToggle.addEventListener("click", ()=>{

        if(window.innerWidth <= 768){
            const shouldOpen = !sidebar.classList.contains("active");
            sidebar.classList.toggle("active", shouldOpen);
            syncSidebarState();
        }else{
            document.body.classList.remove("desktop-sidebar-collapsed");
        }

    });

    syncSidebarState();

}

if(sidebarCollapse){

    sidebarCollapse.addEventListener("click", ()=>{

        document.body.classList.add("desktop-sidebar-collapsed");

    });

}
const themeMenu = document.querySelector(".theme-menu");
const themeMenuTrigger = document.querySelector(".theme-menu-trigger");
const themeMenuOptions = document.querySelector(".theme-menu-options");

if(themeMenu && themeMenuTrigger && themeMenuOptions){
    themeMenuTrigger.addEventListener("click", ()=>{
        const isExpanded = themeMenuTrigger.getAttribute("aria-expanded") === "true";
        themeMenuTrigger.setAttribute("aria-expanded", String(!isExpanded));
        themeMenuOptions.hidden = isExpanded;
    });

    themeMenuOptions.querySelectorAll(".theme-option").forEach(button => {
        button.addEventListener("click", ()=>{
            const isDark = button.dataset.theme === "dark";
            document.body.classList.toggle("dark", isDark);
            document.documentElement.classList.toggle("dark", isDark);
            localStorage.setItem("theme", isDark ? "dark" : "light");
            themeMenuOptions.hidden = true;
            themeMenuTrigger.setAttribute("aria-expanded", "false");
        });
    });

    document.addEventListener("click", event => {
        if(!themeMenu.contains(event.target)){
            themeMenuOptions.hidden = true;
            themeMenuTrigger.setAttribute("aria-expanded", "false");
        }
    });

    document.addEventListener("keydown", event => {
        if(event.key === "Escape"){
            themeMenuOptions.hidden = true;
            themeMenuTrigger.setAttribute("aria-expanded", "false");
        }
    });
}



const savedTheme = localStorage.getItem("theme") === "dark" ||
    (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
document.body.classList.toggle("dark", savedTheme);
document.documentElement.classList.toggle("dark", savedTheme);
document.addEventListener("click", function(event) {
const sidebar = document.querySelector(".sidebar");
const menuToggle = document.querySelector(".menu-toggle");

if (window.innerWidth <= 768 && sidebar && sidebar.classList.contains("active")) {
if (!sidebar.contains(event.target) && !menuToggle.contains(event.target)) {
sidebar.classList.remove("active");
document.body.classList.remove("sidebar-open");
}
}
});

const siteSearch = document.querySelector(".site-search");

if(siteSearch){
    const searchInput = siteSearch.querySelector(".site-search-input");
    const searchResults = siteSearch.querySelector(".site-search-results");
    const searchablePages = [
        { url: "index.html", title: "Ana Sayfa" },
        { url: "isletmede.html", title: "İşletmede" },
        { url: "yolcu-istatistikleri.html", title: "Yolcu İstatistikleri" },
        { url: "insa.html", title: "İnşa Halinde" },
        { url: "proje.html", title: "Proje Aşamasında" },
        { url: "fizibilite.html", title: "Ön Fizibilite Aşamasında" },
        { url: "iptal.html", title: "İptal Edilmiş" },
        { url: "depos.html", title: "Depo Sahaları" }
    ];
    let searchIndexPromise;

    const normalizeSearchText = value => value
        .toLocaleLowerCase("tr-TR")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/ı/g, "i");

    const loadSearchIndex = () => {
        if(!searchIndexPromise){
            searchIndexPromise = Promise.all(searchablePages.map(async page => {
                const response = await fetch(page.url);

                if(!response.ok){
                    throw new Error(`Arama için ${page.url} sayfası yüklenemedi (${response.status}).`);
                }

                const pageDocument = new DOMParser().parseFromString(await response.text(), "text/html");
                const content = pageDocument.querySelector("main, .content") || pageDocument.body;
                const searchableText = content.textContent.replace(/\s+/g, " ").trim();
                const lines = Array.from(pageDocument.querySelectorAll(".line"));
                const lineEntries = lines.flatMap((line, lineIndex) => {
                    const title = line.querySelector(":scope > .line-title");

                    if(!title){
                        return [];
                    }

                    const titleCopy = title.cloneNode(true);
                    titleCopy.querySelectorAll(".line-status, .depo-status, .line-logo, .line-logos")
                        .forEach(element => element.remove());
                    const lineTitle = titleCopy.textContent.replace(/\s+/g, " ").trim();
                    const lineText = `${lineTitle} ${title.nextElementSibling?.textContent || ""}`
                        .replace(/\s+/g, " ")
                        .trim();

                    return [{
                        url: `${page.url}#search-line-${lineIndex}`,
                        title: lineTitle || page.title,
                        searchableText: lineText,
                        normalizedTitle: normalizeSearchText(lineTitle),
                        normalizedText: normalizeSearchText(lineText),
                        scoreBoost: 10
                    }];
                });

                return {
                    ...page,
                    searchableText,
                    normalizedTitle: normalizeSearchText(page.title),
                    normalizedText: normalizeSearchText(searchableText),
                    lineEntries
                };
            })).catch(error => {
                searchIndexPromise = null;
                throw error;
            });
        }

        return searchIndexPromise;
    };

    const showStatus = message => {
        const status = document.createElement("div");
        status.className = "site-search-status";
        status.setAttribute("role", "status");
        status.textContent = message;
        searchResults.replaceChildren(status);
        searchResults.hidden = false;
        searchInput.setAttribute("aria-expanded", "true");
    };

    const renderResults = (results, query) => {
        searchResults.replaceChildren();

        if(results.length === 0){
            showStatus("Eşleşen sayfa bulunamadı.");
            return;
        }

        results.slice(0, 8).forEach(result => {
            const link = document.createElement("a");
            const title = document.createElement("strong");
            const snippet = document.createElement("span");
            const matchAt = result.normalizedText.indexOf(query.split(" ")[0]);
            const startAt = Math.max(0, Math.min(matchAt, result.searchableText.length) - 55);

            link.className = "site-search-link";
            link.href = result.url;
            link.setAttribute("role", "option");
            title.textContent = result.title;
            snippet.textContent = result.searchableText.slice(startAt, startAt + 150);
            link.append(title, snippet);
            searchResults.append(link);
        });

        searchResults.hidden = false;
        searchInput.setAttribute("aria-expanded", "true");
    };

    searchInput.addEventListener("input", async () => {
        const query = normalizeSearchText(searchInput.value.trim()).replace(/\s+/g, " ");

        if(!query){
            searchResults.hidden = true;
            searchInput.setAttribute("aria-expanded", "false");
            return;
        }

        showStatus("Sayfalar aranıyor...");

        try{
            const pages = await loadSearchIndex();

            if(normalizeSearchText(searchInput.value.trim()).replace(/\s+/g, " ") !== query){
                return;
            }

            const terms = query.split(" ").filter(Boolean);
            const matches = pages.flatMap(page => {
                const pageMatches = page.lineEntries
                    .filter(entry => terms.every(term =>
                        entry.normalizedTitle.includes(term) || entry.normalizedText.includes(term)
                    ))
                    .map(entry => ({
                        ...entry,
                        score: terms.reduce((score, term) => {
                            const titleMatch = entry.normalizedTitle.includes(term);
                            const count = entry.normalizedText.split(term).length - 1;
                            return score + count + (titleMatch ? 5 : 0) + entry.scoreBoost;
                        }, 0)
                    }));
                const pageMatchesQuery = terms.every(term =>
                    page.normalizedTitle.includes(term) || page.normalizedText.includes(term)
                );

                if(pageMatches.length || !pageMatchesQuery){
                    return pageMatches;
                }

                return [{
                    ...page,
                    url: page.url,
                    score: terms.reduce((score, term) => {
                        const titleMatch = page.normalizedTitle.includes(term);
                        const count = page.normalizedText.split(term).length - 1;
                        return score + count + (titleMatch ? 5 : 0);
                    }, 0)
                }];
            })
                .sort((first, second) => second.score - first.score);

            renderResults(matches, query);
        }catch(error){
            console.error(error);
            showStatus("Arama sayfaları yüklenemedi. Bağlantınızı kontrol edip yeniden deneyin.");
        }
    });

    searchInput.addEventListener("keydown", event => {
        if(event.key === "Escape"){
            searchResults.hidden = true;
            searchInput.setAttribute("aria-expanded", "false");
        }else if(event.key === "ArrowDown"){
            const firstResult = searchResults.querySelector(".site-search-link");
            if(firstResult){
                event.preventDefault();
                firstResult.focus();
            }
        }else if(event.key === "Enter"){
            const firstResult = searchResults.querySelector(".site-search-link");
            if(firstResult && !searchResults.hidden){
                window.location.href = firstResult.href;
            }
        }
    });

    document.addEventListener("click", event => {
        if(!siteSearch.contains(event.target)){
            searchResults.hidden = true;
            searchInput.setAttribute("aria-expanded", "false");
        }
    });
}
