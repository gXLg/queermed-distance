class Modal {
  constructor(id) {
    this.id = id;
  }

  open() {
    document.getElementById(this.id).classList.add("open");
  }

  close() {
    document.getElementById(this.id).classList.remove("open");
  }
}

class App {
  constructor(cities, categories, preSelected) {
    this.cities = cities;
    this.categories = categories;
    this.selectedCity = preSelected ?? null;
    this.selectedCategories = [];

    this.cityModal = new Modal("cityModal");
    this.categoryModal = new Modal("categoryModal");
    this.openedModal = null;

    const citySearch = document.getElementById("citySearch");
    citySearch.addEventListener("input", () => this.updateModalCity());
    document.getElementById("cityFilter").addEventListener("click", () => {
      citySearch.value = "";
      this.updateModalCity();
      this.openModal(this.cityModal);
      setTimeout(() => citySearch.focus(), 50);
    });

    const categorySearch = document.getElementById("categorySearch");
    categorySearch.addEventListener("input", () => this.updateModalCategoriesSearch());
    document.getElementById("categoryFilter").addEventListener("click", () => {
      categorySearch.value = "";
      this.updateModalCategories();
      this.openModal(this.categoryModal);
      setTimeout(() => categorySearch.focus(), 50);
    });

    document.querySelectorAll("[data-close]").forEach(button => {
      button.addEventListener("click", () => {
        this.closeModal();
      });
    });

    document.querySelectorAll(".modal-backdrop").forEach(backdrop => {
       backdrop.addEventListener("click", event => {
        if (event.target === backdrop) {
          this.closeModal();
        }
      });
    });

    document.addEventListener("keydown", event => {
      if (event.key == "Escape") {
        this.closeModal();
      }
    });

    this.updateFilterCity();
    this.updateFilterCategories();
  }

  openModal(modal) {
    this.openedModal?.close();
    this.openedModal = modal;
    modal.open();
  }

  closeModal() {
    this.openedModal?.close();
    this.openedModal = null;
  }

  selectCity(city) {
    localStorage.setItem("queermed-distance.city", city.id);
    this.selectedCity = city;
    this.updateFilterCity();
    this.updateModalCity();
  }

  selectCategories(categories) {
    this.selectedCategories = categories;
    this.updateFilterCategories();
    this.updateModalCategories();
  }

  updateFilterCity() {
    const selected = document.getElementById("selectedCity");
    selected.innerHTML = "";
    if (this.selectedCity == null) {
      selected.innerHTML = `<span style="color: #89919b;">None selected</span>`;
      return;
    }
    selected.textContent = this.selectedCity.name;
  }

  updateModalCity() {
    const citySearch = document.getElementById("citySearch");
    const query = citySearch.value.trim().toLowerCase();
    const filtered = this.cities.filter(city => city.name.toLowerCase().includes(query));
    const cityList = document.getElementById("cityList");
    cityList.innerHTML = "";
    if (filtered.length === 0) {
      cityList.innerHTML = `<div style="padding: 12px; color: #89919b; font-size: 14px;">No cities found.</div>`;
      return;
    }
    filtered.forEach(city => {
      const option = document.createElement("div");
      const isSelected = this.selectedCity?.id === city.id;
      option.className = "city-option" + (isSelected ? " selected" : "");
      option.innerHTML = `<span>${city.name}</span>` + (isSelected ? '<span class="check">✓</span>' : '');
      option.addEventListener("click", () => {
        this.selectCity(city);
        this.closeModal();
      });
      cityList.appendChild(option);
    });
  }

  updateFilterCategories() {
    const summary = document.getElementById("categorySummary");
    summary.innerHTML = "";
    if (this.selectedCategories.length === 0) {
      summary.innerHTML = `<span style="color: #89919b;">None selected</span>`;
      return;
    }
    const visible = this.selectedCategories.slice(0, 3);
    visible.forEach(category => {
      const { name, id } = category;
      const tag = document.createElement("span");
      tag.className = "summary-tag";
      tag.textContent = name;
      summary.appendChild(tag);
    });

    if (this.selectedCategories.length > 3) {
      const more = document.createElement("span");
      more.className = "summary-tag";
      more.textContent = `+${this.selectedCategories.length - 3}`;
      summary.appendChild(more);
    }
  }

  updateModalCategories() {
    this.updateModalCategoriesSelected();
    this.updateModalCategoriesSearch();
  }

  updateModalCategoriesSelected() {
    const selectedCategoriesElement = document.getElementById("selectedCategories");
    selectedCategoriesElement.innerHTML = "";
    if (this.selectedCategories.length === 0) {
      selectedCategoriesElement.innerHTML = `<span class="empty-selected">No categories selected</span>`;
      return;
    }
    this.selectedCategories.forEach(category => {
      const { name, id } = category;
      const tag = document.createElement("div");
      tag.className = "category-tag";
      tag.innerHTML = `<span>${name}</span><button class="category-remove" aria-label="Remove ${name}"> × </button>`;
      tag.querySelector("button").addEventListener("click", () => {
        this.selectCategories(this.selectedCategories.filter(item => item.id !== id));
      });
      selectedCategoriesElement.appendChild(tag);
    });
  }

  updateModalCategoriesSearch() {
    const categorySearch = document.getElementById("categorySearch");
    const query = categorySearch.value.trim().toLowerCase();
    const filtered = this.categories.filter(category => category.name.toLowerCase().includes(query));
    categoryList.innerHTML = "";
    if (filtered.length === 0) {
      categoryList.innerHTML = `<div style="padding: 12px; color: #89919b; font-size: 14px;">No categories found.</div>`;
      return;
    }
    filtered.forEach(category => {
      const isSelected = this.selectedCategories.some(c => c.id === category.id);
      const option = document.createElement("div");
      option.className = "category-option" + (isSelected ? " selected" : "");
      option.textContent = category.name + (isSelected ? " ✓" : "");
      if (!isSelected) {
        option.addEventListener("click", () => {
          this.selectCategories(this.selectedCategories.concat(category));
        });
      }
      categoryList.appendChild(option);
    });
  }
}

(async () => {

  const cities = await fetch("/api/cities").then(r => r.json());
  const categories = await fetch("/api/categories").then(r => r.json());
  const storedId = localStorage.getItem("queermed-distance.city") ?? null;
  let preSelected = null;
  if (storedId != null) {
    preSelected = cities.find(c => c.id == storedId) ?? null;
  }
  const app = new App(cities, categories, preSelected);

  const resultsContainer = document.getElementById("results");

  function renderResults(results) {
    resultsContainer.innerHTML = "";
    if (results.length == 0) {
      resultsContainer.innerHTML = `
        <div class="result-entry">
          <div class="result-info">
            <h3 class="result-name">No doctors found for these categories</h3>
          </div>
        </div>
      `;
      return;
    }
    results.forEach(result => {
      const entry = document.createElement("article");

      const city = result.city == null ? "Online" : app.cities.find(c => c.id == result.city).name;
      const categories = result.categories.map(c => app.categories.find(d => d.id == c).name);

      entry.className = "result-entry";
      entry.innerHTML = `
        <div class="result-info">
          <h3 class="result-name"><a href="${result.url}" target="_blank">${result.name}</a></h3>
          <div class="result-categories">
            ${categories.map(category => `<span class="result-category">${category}</span>`).join("")}
          </div>
        </div>

        <div class="result-location">
          <div class="result-city">${city}</div>
          <div class="result-distance">${result.distance} km</div>
        </div>
      `;
      resultsContainer.appendChild(entry);
    });
  }

  function renderError() {
    resultsContainer.innerHTML = `
      <div class="result-entry result-error">
        <div class="result-info">
          <h3 class="result-name">Something went wrong</h3>
        </div>
      </div>
    `;
  }

  const searchButton = document.querySelector(".search-button");
  searchButton.addEventListener("click", async () => {
    if (searchButton.disabled) {
      return;
    }
    searchButton.disabled = true;
    searchButton.style.opacity = "0.5";
    searchButton.style.cursor = "wait";
    resultsContainer.innerHTML = "";

    const body = new FormData();
    if (app.selectedCity != null) {
      body.append("city", app.selectedCity.id);
    }
    for (const cat of app.selectedCategories) {
      body.append("categories", cat.id);
    }
    try {
      const res = await fetch("/api/search", {
        "method": "POST",
        body
      });
      const { success, data } = await res.json();
      if (!success) {
        renderError();
      } else {
        renderResults(data);
      }
    } catch (err) {
      console.error(err);
      renderError();
    }

    searchButton.disabled = false;
    searchButton.style.opacity = "";
    searchButton.style.cursor = "";
  });

})();
