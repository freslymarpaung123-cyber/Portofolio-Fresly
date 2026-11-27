(() => {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const preloader = document.getElementById('preloader');
  const loadNumber = document.getElementById('load-number');
  const loadBar = document.getElementById('load-bar');
  const skipIntro = document.getElementById('skip-intro');
  let introFinished = false;
  let introFrame = 0;
  const finishIntro = () => {
    if (introFinished) return;
    introFinished = true;
    if (preloader) preloader.classList.add('is-done');
    window.cancelAnimationFrame(introFrame);
    document.body.classList.add('intro-finished');
  };

  if (prefersReducedMotion) {
    finishIntro();
  } else if (preloader && loadNumber && loadBar) {
    const startTime = performance.now();
    const duration = 1450;
    const animateIntro = (now) => {
      const progress = Math.min(100, Math.round(((now - startTime) / duration) * 100));
      loadNumber.textContent = String(progress);
      loadBar.style.width = `${progress}%`;
      if (progress < 100 && !introFinished) introFrame = window.requestAnimationFrame(animateIntro);
      else finishIntro();
    };
    introFrame = window.requestAnimationFrame(animateIntro);
  } else {
    finishIntro();
  }
  if (skipIntro) skipIntro.addEventListener('click', finishIntro);

  // Generate a lightweight animated starfield. Stars subtly drift with pointer movement.
  const canvas = document.getElementById('starfield');
  const context = canvas?.getContext('2d');
  let stars = [];
  let width = 0;
  let height = 0;
  let pointerX = 0;
  let pointerY = 0;
  let starFrame = 0;

  const makeStars = () => {
    if (!canvas || !context) return;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.7);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * pixelRatio);
    canvas.height = Math.floor(height * pixelRatio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    const count = Math.min(170, Math.max(65, Math.floor((width * height) / 9000)));
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.35 + .25,
      alpha: Math.random() * .65 + .2,
      twinkle: Math.random() * .018 + .004,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * .13 + .025,
      depth: Math.random() * .8 + .2
    }));
  };

  const drawStars = () => {
    if (!context) return;
    context.clearRect(0, 0, width, height);
    for (const star of stars) {
      if (!prefersReducedMotion) {
        star.phase += star.twinkle;
        star.y += star.speed * .18;
        if (star.y > height + 2) {
          star.y = -2;
          star.x = Math.random() * width;
        }
      }
      const shimmer = prefersReducedMotion ? 1 : .62 + (Math.sin(star.phase) + 1) * .19;
      const parallaxX = prefersReducedMotion ? 0 : pointerX * star.depth * 8;
      const parallaxY = prefersReducedMotion ? 0 : pointerY * star.depth * 6;
      context.beginPath();
      context.arc(star.x + parallaxX, star.y + parallaxY, star.radius, 0, Math.PI * 2);
      context.fillStyle = `rgba(190, 218, 255, ${star.alpha * shimmer})`;
      context.fill();
    }
    if (!prefersReducedMotion) starFrame = window.requestAnimationFrame(drawStars);
  };

  if (canvas && context) {
    makeStars();
    drawStars();
    window.addEventListener('resize', makeStars, { passive: true });
    window.addEventListener('pointermove', (event) => {
      pointerX = (event.clientX / Math.max(1, width) - .5) * 2;
      pointerY = (event.clientY / Math.max(1, height) - .5) * 2;
    }, { passive: true });
  }

  // Mobile navigation.
  const menuToggle = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  const navItems = document.querySelectorAll('.nav-links a');
  const closeMenu = () => {
    if (!menuToggle || !navLinks) return;
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Buka navigasi');
    navLinks.classList.remove('is-open');
    document.body.classList.remove('menu-open');
  };

  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
      menuToggle.setAttribute('aria-expanded', String(!isOpen));
      menuToggle.setAttribute('aria-label', isOpen ? 'Buka navigasi' : 'Tutup navigasi');
      navLinks.classList.toggle('is-open', !isOpen);
      document.body.classList.toggle('menu-open', !isOpen);
    });
    navItems.forEach((item) => item.addEventListener('click', closeMenu));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMenu();
    });
  }

  // Reveal content as sections enter the viewport.
  const revealItems = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !prefersReducedMotion) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: .12, rootMargin: '0px 0px -35px 0px' });
    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }

  // Active navigation state follows the currently visible section.
  const observedSections = document.querySelectorAll('main section[id]');
  if ('IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navItems.forEach((link) => {
          const active = link.getAttribute('href') === `#${entry.target.id}`;
          link.classList.toggle('active', active);
        });
      });
    }, { rootMargin: '-35% 0px -55% 0px' });
    observedSections.forEach((section) => sectionObserver.observe(section));
  }

  // Top scroll progress.
  const progressBar = document.getElementById('scroll-progress');
  const updateScrollProgress = () => {
    if (!progressBar) return;
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
    progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
  };
  window.addEventListener('scroll', updateScrollProgress, { passive: true });
  updateScrollProgress();

  // Profile card gentle 3D tilt on pointer devices.
  const cardWrap = document.getElementById('profile-card-wrap');
  const profileCard = document.getElementById('profile-card');
  if (cardWrap && profileCard && !prefersReducedMotion && window.matchMedia('(pointer: fine)').matches) {
    cardWrap.addEventListener('pointermove', (event) => {
      const rect = cardWrap.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - .5;
      const y = (event.clientY - rect.top) / rect.height - .5;
      profileCard.style.transform = `rotateY(${x * 13}deg) rotateX(${-y * 13}deg)`;
    });
    cardWrap.addEventListener('pointerleave', () => { profileCard.style.transform = ''; });
  }

  // Project filters.
  const filterButtons = document.querySelectorAll('[data-filter]');
  const projectCards = document.querySelectorAll('.project-grid [data-category]');
  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const filter = button.dataset.filter;
      filterButtons.forEach((item) => {
        const active = item === button;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-pressed', String(active));
      });
      projectCards.forEach((card) => {
        const visible = filter === 'all' || card.dataset.category === filter;
        card.classList.toggle('is-hidden', !visible);
      });
    });
  });

  // Project details shown in an accessible native dialog.
  const dialog = document.getElementById('project-dialog');
  const dialogLabel = document.getElementById('dialog-label');
  const dialogTitle = document.getElementById('dialog-title');
  const dialogDescription = document.getElementById('dialog-description');
  const dialogContributions = document.getElementById('dialog-contributions');
  const dialogTags = document.getElementById('dialog-tags');
  const projectDetails = {
    pulo: {
      label: 'PROYEK MAGANG · FRONT-END DEVELOPMENT',
      title: 'Website Resmi Kabupaten Administrasi Kepulauan Seribu',
      description: 'Pengembangan antarmuka website resmi Kabupaten Administrasi Kepulauan Seribu dengan mengimplementasikan rancangan Figma menjadi halaman web fungsional.',
      contributions: [
        'Mengimplementasikan rancangan antarmuka menggunakan HTML, CSS, dan JavaScript.',
        'Mengembangkan halaman Beranda, Statistik, dan Informasi.',
        'Menyesuaikan tampilan agar responsif pada desktop, tablet, dan ponsel Android.',
        'Mengimplementasikan visualisasi data berupa grafik pada halaman Statistik.'
      ],
      technologies: ['HTML5', 'CSS3', 'JavaScript', 'Figma', 'Responsive Web Design']
    },
    jasa: {
      label: 'PROYEK BOOTCAMP · TEAM PROJECT · UI DESIGN',
      title: 'Aplikasi Mobile Jasa Sedot WC',
      description: 'Proyek perancangan antarmuka aplikasi mobile yang dikerjakan secara berkelompok menggunakan Figma. Desain mencakup tampilan autentikasi dan informasi layanan.',
      contributions: [
        'Berkontribusi dalam pengerjaan rancangan antarmuka aplikasi bersama anggota tim.',
        'Berpartisipasi dalam penyusunan tampilan aplikasi mobile menggunakan Figma.',
        'Bekerja secara kolaboratif dalam menyusun elemen visual dan tata letak aplikasi.'
      ],
      technologies: ['Figma', 'Mobile UI Design', 'Team Collaboration']
    },
    payroll: {
      label: 'PROYEK AKADEMIK · WEB DEVELOPMENT',
      title: 'Sistem Penggajian',
      description: 'Aplikasi penggajian berbasis web untuk mendukung pengelolaan data pegawai, jabatan, penggajian, dan absensi.',
      contributions: [
        'Mengembangkan aplikasi menggunakan Laravel dan PHP.',
        'Menerapkan fitur CRUD untuk pengelolaan data.',
        'Mengintegrasikan MySQL sebagai basis data aplikasi.',
        'Menggunakan AdminLTE untuk tampilan dashboard administrasi.'
      ],
      technologies: ['Laravel', 'PHP', 'MySQL', 'CRUD', 'AdminLTE']
    },
    visual: {
      label: 'PROYEK AKADEMIK · MULTIMEDIA',
      title: 'Desain Visual dan Grafis',
      description: 'Proyek akademik yang berfokus pada pembuatan aset visual digital dan penerapan prinsip desain grafis.',
      contributions: [
        'Membuat aset visual seperti infografis dan ikon navigasi.',
        'Menyusun tata letak presentasi proyek.',
        'Menerapkan prinsip teori warna dan tipografi untuk menjaga konsistensi visual.'
      ],
      technologies: ['Visual Design', 'Infographic', 'Typography', 'Color Theory', 'Canva']
    }
  };

  document.querySelectorAll('[data-project]').forEach((button) => {
    button.addEventListener('click', () => {
      const project = projectDetails[button.dataset.project];
      if (!project || !dialog || !dialogLabel || !dialogTitle || !dialogDescription || !dialogContributions || !dialogTags) return;
      dialogLabel.textContent = project.label;
      dialogTitle.textContent = project.title;
      dialogDescription.textContent = project.description;
      dialogContributions.replaceChildren();
      project.contributions.forEach((contribution) => {
        const item = document.createElement('li');
        item.textContent = contribution;
        dialogContributions.appendChild(item);
      });
      dialogTags.replaceChildren();
      project.technologies.forEach((technology) => {
        const tag = document.createElement('span');
        tag.textContent = technology;
        dialogTags.appendChild(tag);
      });
      dialog.showModal();
    });
  });

  const closeDialog = document.querySelector('.dialog-close');
  if (closeDialog && dialog) closeDialog.addEventListener('click', () => dialog.close());
  if (dialog) {
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });
  }

  // Side scroll controls.
  document.getElementById('scroll-up')?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' }));
  document.getElementById('scroll-down')?.addEventListener('click', () => {
    const nextSection = Array.from(observedSections).find((section) => section.getBoundingClientRect().top > 90);
    if (nextSection) nextSection.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  });

  // Small feedback message for copy actions.
  const toast = document.getElementById('toast');
  let toastTimer;
  const showToast = (message) => {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('show'), 2300);
  };

  const copyNameButton = document.getElementById('copy-name');
  if (copyNameButton) {
    copyNameButton.addEventListener('click', async () => {
      const name = 'Fresly Gabriel Marpaung';
      try {
        await navigator.clipboard.writeText(name);
        showToast('Nama berhasil disalin.');
      } catch (error) {
        showToast(`Salin nama: ${name}`);
      }
    });
  }

  // Set the footer year automatically.
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  window.addEventListener('beforeunload', () => {
    window.cancelAnimationFrame(starFrame);
    window.cancelAnimationFrame(introFrame);
  });
})();
