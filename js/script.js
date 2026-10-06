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
        const contentHeight = content.scrollHeight + 40;
        content.style.maxHeight = `${contentHeight}px`;
        content.style.opacity = "1";
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
        return "Açıldı";
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
        return "Bugün";
    }

    return parts.join(" ");

}

function updateCountdowns(){

    const items = document.querySelectorAll(".completion-item[data-target]");

    items.forEach(item => {
        const dateNode = item.querySelector(".completion-date");

        if(!dateNode){
            return;
        }

        const targetDate = item.dataset.target;
        dateNode.textContent = `Kalan süre: ${getRemainingText(targetDate)}`;
    });

}

updateCountdowns();
setInterval(updateCountdowns, 60000);

const contactForm = document.querySelector(".contact-form");

if(contactForm){

    const requiredFields = contactForm.querySelectorAll("[required]");

    requiredFields.forEach(field => {

        field.addEventListener("invalid", ()=>{
            field.parentElement.classList.add("has-error");
        });

        field.addEventListener("input", ()=>{
            if(field.value.trim()){
                field.parentElement.classList.remove("has-error");
            }
        });

    });

    contactForm.addEventListener("submit", async event => {

        event.preventDefault();

        let hasEmptyField = false;
        const success = document.querySelector("#form-success");
        const error = document.querySelector("#form-error");
        const button = document.querySelector("#submit-btn");

        requiredFields.forEach(field => {
            const isEmpty = !field.value.trim();
            field.parentElement.classList.toggle("has-error", isEmpty);
            hasEmptyField = hasEmptyField || isEmpty;
        });

        if(hasEmptyField){
            return;
        }

        button.disabled = true;
        button.textContent = "Gönderiliyor...";
        success.textContent = "";
        error.textContent = "";

        try{

            const response = await fetch(contactForm.action, {
                method: "POST",
                body: new FormData(contactForm),
                headers: {
                    Accept: "application/json"
                }
            });

            if(response.ok){
                contactForm.reset();
                success.textContent = "Mesajınız başarıyla gönderildi!";
            }else{
                error.textContent = "Mesaj gönderilirken bir hata oluştu.";
            }

        }catch(errorResponse){
            error.textContent = "Bağlantı hatası oluştu. Lütfen tekrar deneyin.";
        }finally{
            button.disabled = false;
            button.textContent = "Mesajı Gönder";
        }

    });

}


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
        { url: "insa.html", title: "İnşa Halinde" },
        { url: "proje.html", title: "Proje Aşamasında" },
        { url: "fizibilite.html", title: "Ön Fizibilite Aşamasında" },
        { url: "iptal.html", title: "İptal Edilmiş" },
        { url: "depos.html", title: "Depo Sahaları" },
        { url: "bizeulasin.html", title: "Bize Ulaşın" }
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
