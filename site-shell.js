(function(){
  document.body.classList.add("js-ready");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const touch = matchMedia("(hover: none)").matches;

  const savedTheme = localStorage.getItem("comprex99-theme");
  if(savedTheme){
    document.body.dataset.theme = savedTheme;
  }

  const swatches = document.querySelectorAll(".sw");
  swatches.forEach((button) => {
    button.classList.toggle("active", button.dataset.theme === document.body.dataset.theme);
    button.addEventListener("click", () => {
      document.body.dataset.theme = button.dataset.theme;
      localStorage.setItem("comprex99-theme", button.dataset.theme);
      swatches.forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
    });
  });

  const cursor = document.getElementById("cursor");
  if(cursor && !touch){
    let cx = innerWidth / 2;
    let cy = innerHeight / 2;
    let tx = cx;
    let ty = cy;
    addEventListener("mousemove", (event) => {
      tx = event.clientX;
      ty = event.clientY;
    });
    const loop = () => {
      cx += (tx - cx) * 0.44;
      cy += (ty - cy) * 0.44;
      cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0) translate(-50%, -50%)`;
      requestAnimationFrame(loop);
    };
    loop();
    document.querySelectorAll("a,button,input,textarea,select,summary").forEach((element) => {
      element.addEventListener("mouseenter", () => cursor.classList.add("hov"));
      element.addEventListener("mouseleave", () => cursor.classList.remove("hov"));
    });
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if(entry.isIntersecting){
        entry.target.classList.add("in");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
  setTimeout(() => {
    document.querySelectorAll(".reveal:not(.in)").forEach((element) => element.classList.add("in"));
  }, 900);

  if(reduce || touch) return;

  const heroBg = document.querySelector(".hero-bg");
  if(heroBg){
    addEventListener("scroll", () => {
      heroBg.style.transform = `translateX(${-scrollY * 0.25}px)`;
    }, { passive: true });
  }

  document.querySelectorAll("[data-tilt]").forEach((card) => {
    card.addEventListener("mousemove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(900px) rotateY(${x * 3.5}deg) rotateX(${-y * 3.5}deg)`;
    });
    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
    });
  });

  document.querySelectorAll(".magnet").forEach((element) => {
    element.addEventListener("mousemove", (event) => {
      const rect = element.getBoundingClientRect();
      element.style.transform = `translate(${(event.clientX - rect.left - rect.width / 2) * 0.1}px, ${(event.clientY - rect.top - rect.height / 2) * 0.1}px)`;
    });
    element.addEventListener("mouseleave", () => {
      element.style.transform = "";
    });
  });
})();
