import { useEffect, useRef, useState } from "react";

const navItems = [
  ["Генеральный подряд", "#general"],
  ["Проектирование", "#design"],
  ["Объекты", "#objects"],
  ["О компании", "#company"],
  ["Документы", "#documents"],
  ["Контакты", "#contact"],
];

const workTypes = [
  {
    number: "01",
    title: "Генеральный подряд",
    text: "Организация площадки, графика, снабжения, подрядчиков и комплекта документов.",
  },
  {
    number: "02",
    title: "Капитальный ремонт",
    text: "Подготовка и выполнение комплекса работ с привязкой к проекту и смете.",
  },
  {
    number: "03",
    title: "Фасады",
    text: "Подготовительные, ремонтные и отделочные работы по фасадным системам.",
  },
  {
    number: "04",
    title: "Кровли",
    text: "Ремонт и устройство кровель с контролем узлов, материалов и этапов сдачи.",
  },
  {
    number: "05",
    title: "Инженерные системы",
    text: "Теплоснабжение, водоотведение и электромонтажные работы в составе задачи.",
  },
  {
    number: "06",
    title: "Проектная документация",
    text: "Подготовка, координация и корректировка решений под фактические условия объекта.",
  },
];

const processSteps = [
  ["01", "Получаем материалы", "Техническое задание, проект, смета, ведомость объёмов и исходные данные."],
  ["02", "Фиксируем задачу", "Состав работ, ограничения, зоны ответственности и требуемый результат."],
  ["03", "Готовим решение", "Проектные решения, смета и календарный график в согласованном объёме."],
  ["04", "Организуем работы", "Площадка, снабжение, подрядчики и последовательность производства."],
  ["05", "Контролируем", "Сроки, объёмы, качество, изменения и комплектность документов."],
  ["06", "Передаём результат", "Подготовка выполненных работ и документации к предъявлению заказчику."],
];

const objectDrafts = [
  {
    type: "Фасады",
    place: "Тюмень",
    title: "Капитальный ремонт фасадов многоквартирных домов",
    scope: "Проектные решения · организация работ · исполнительная документация",
  },
  {
    type: "Кровли",
    place: "Тюмень и Тобольск",
    title: "Ремонт и устройство кровель на объектах капитального ремонта",
    scope: "График · снабжение · производство · подготовка к сдаче",
  },
  {
    type: "Инженерные системы",
    place: "Тюменская область",
    title: "Работы по теплоснабжению, водоотведению и электроснабжению",
    scope: "Исходные данные · ПСД · СМР · комплект документов",
  },
];

function ArrowIcon({ direction = "right" }) {
  return (
    <svg
      aria-hidden="true"
      className={`icon icon--${direction}`}
      viewBox="0 0 24 24"
      fill="none"
    >
      <path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function PaperclipIcon() {
  return (
    <svg aria-hidden="true" className="icon" viewBox="0 0 24 24" fill="none">
      <path
        d="m8.4 12.8 5.75-5.75a3 3 0 0 1 4.25 4.24l-7.52 7.52a5 5 0 1 1-7.07-7.07l7.18-7.18"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="square"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" className="icon" viewBox="0 0 24 24" fill="none">
      <path d="M5 5l14 14M19 5 5 19" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg aria-hidden="true" className="icon" viewBox="0 0 24 24" fill="none">
      <path d="M3 7h18M3 12h18M3 17h18" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function Brand() {
  const logoImage = `${import.meta.env.BASE_URL}assets/tsk-fort-logo.png`;

  return (
    <a className="brand" href="#top" aria-label="ТСК ФОРТ — на главную">
      <img
        className="brand__logo"
        src={logoImage}
        alt=""
        width="576"
        height="344"
      />
    </a>
  );
}

function Header({ menuOpen, setMenuOpen }) {
  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Brand />
        <nav className="desktop-nav" aria-label="Основная навигация">
          {navItems.slice(0, 5).map(([label, href]) => (
            <a key={href} href={href}>
              {label}
            </a>
          ))}
        </nav>
        <a className="header-contact" href="tel:+79128352998">
          <span>Связаться</span>
          <strong>+7 912 835-29-98</strong>
        </a>
        <button
          className="menu-toggle"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
          onClick={() => setMenuOpen((value) => !value)}
        >
          {menuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>
      <div className={`mobile-menu ${menuOpen ? "is-open" : ""}`} id="mobile-navigation">
        <nav className="container mobile-menu__inner" aria-label="Мобильная навигация">
          {navItems.map(([label, href], index) => (
            <a key={href} href={href} onClick={() => setMenuOpen(false)}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              {label}
              <ArrowIcon />
            </a>
          ))}
          <a className="mobile-menu__phone" href="tel:+79128352998">
            +7 912 835-29-98
          </a>
        </nav>
      </div>
    </header>
  );
}

function SectionHeading({ index, eyebrow, title, text, light = false }) {
  return (
    <div className={`section-heading ${light ? "section-heading--light" : ""}`}>
      <div className="section-heading__meta">
        <span>{index}</span>
        <span>{eyebrow}</span>
      </div>
      <div className="section-heading__copy">
        <h2>{title}</h2>
        {text && <p>{text}</p>}
      </div>
    </div>
  );
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedService, setSelectedService] = useState("Генеральный подряд");
  const [fileName, setFileName] = useState("");
  const [formStatus, setFormStatus] = useState("");
  const [legalModal, setLegalModal] = useState(null);
  const dialogRef = useRef(null);

  const heroImage = `${import.meta.env.BASE_URL}assets/hero-construction-concept.jpg`;

  useEffect(() => {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("is-visible");
        });
      },
      { threshold: 0.08 },
    );

    document.querySelectorAll("[data-reveal]").forEach((element) => revealObserver.observe(element));
    return () => revealObserver.disconnect();
  }, []);

  useEffect(() => {
    document.body.classList.toggle("menu-open", menuOpen);
    return () => document.body.classList.remove("menu-open");
  }, [menuOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (legalModal && !dialog.open) dialog.showModal();
    if (!legalModal && dialog.open) dialog.close();
  }, [legalModal]);

  const handleSubmit = (event) => {
    event.preventDefault();
    setFormStatus(
      "Форма работает в демонстрационном режиме. На следующем этапе подключим отправку в почту или Битрикс24.",
    );
  };

  return (
    <>
      <a className="skip-link" href="#main-content">
        Перейти к содержанию
      </a>
      <Header menuOpen={menuOpen} setMenuOpen={setMenuOpen} />

      <main id="main-content">
        <section className="hero" id="top">
          <div className="hero__grid" aria-hidden="true" />
          <div className="container hero__inner">
            <div className="hero__content" data-reveal>
              <div className="eyebrow">
                <span className="eyebrow__dot" />
                Тюмень · Тобольск
              </div>
              <h1>
                Генеральный подряд
                <span>и проектирование</span>
              </h1>
              <p className="hero__lead">
                Помогаем пройти путь от исходных данных и проектных решений до организации работ,
                контроля и комплекта исполнительной документации.
              </p>
              <div className="hero__actions">
                <a className="button button--accent" href="#contact">
                  Обсудить объект <ArrowIcon />
                </a>
                <a className="button button--ghost" href="#brief">
                  Передать проект или ТЗ
                </a>
              </div>
              <div className="hero__tags" aria-label="Основные направления">
                <span>Строительство</span>
                <span>Капитальный ремонт</span>
                <span>Проектная документация</span>
              </div>
            </div>

            <figure className="hero-visual" data-reveal>
              <div className="hero-visual__image">
                <img
                  src={heroImage}
                  alt="Иллюстративная строительная площадка: инженеры изучают проектные чертежи"
                  width="1536"
                  height="1024"
                  fetchPriority="high"
                />
              </div>
              <figcaption>
                <span>Визуальная концепция</span>
                Заменить на фотографию объекта ТСК ФОРТ
              </figcaption>
              <div className="hero-visual__coordinate" aria-hidden="true">
                57°09′ N&nbsp;&nbsp;65°32′ E
              </div>
            </figure>
          </div>

          <div className="container hero__rail" data-reveal>
            <div><span>01</span><strong>Единый рабочий контур</strong></div>
            <div><span>02</span><strong>Проектные решения + СМР</strong></div>
            <div><span>03</span><strong>Документы к сдаче</strong></div>
          </div>
        </section>

        <section className="services section" id="general">
          <div className="container">
            <SectionHeading
              index="01"
              eyebrow="Основные направления"
              title="Берём ответственность за связку решений и работ"
              text="Два самостоятельных направления работают в одном проектном контуре — без разрыва между документацией и площадкой."
            />

            <div className="service-panels">
              <article className="service-panel service-panel--dark" data-reveal>
                <div className="service-panel__top">
                  <span className="service-panel__index">01 / 02</span>
                  <span className="service-panel__label">Приоритетное направление</span>
                </div>
                <h3>Генеральный подряд</h3>
                <p>
                  Планируем и координируем работы на объекте. Увязываем график, снабжение,
                  подрядчиков, качество и исполнительную документацию.
                </p>
                <ul>
                  <li>подготовка к началу работ</li>
                  <li>календарный график и контрольные точки</li>
                  <li>снабжение и координация исполнителей</li>
                  <li>контроль объёмов и качества</li>
                  <li>подготовка результата к сдаче</li>
                </ul>
                <a href="#process" className="service-panel__link">
                  Как организована работа <ArrowIcon />
                </a>
              </article>

              <article className="service-panel service-panel--paper" id="design" data-reveal>
                <div className="service-panel__top">
                  <span className="service-panel__index">02 / 02</span>
                  <span className="service-panel__label">Проектная часть</span>
                </div>
                <h3>Проектирование</h3>
                <p>
                  Формируем состав исходных данных и техническое задание. Организуем разработку
                  или корректировку решений с учётом условий объекта и предстоящих работ.
                </p>
                <ul>
                  <li>сбор и проверка исходных данных</li>
                  <li>подготовка технического задания</li>
                  <li>проектная и рабочая документация</li>
                  <li>сметная часть</li>
                  <li>увязка проекта со строительством</li>
                </ul>
                <a href="#brief" className="service-panel__link">
                  Передать исходные данные <ArrowIcon />
                </a>
              </article>
            </div>
          </div>
        </section>

        <section className="work-matrix section section--dark" id="company">
          <div className="container">
            <SectionHeading
              index="02"
              eyebrow="Задачи и компетенции"
              title="Что можно передать ТСК ФОРТ"
              text="Выберите направление — покажем, из каких частей формируется рабочая задача."
              light
            />

            <div className="work-matrix__layout">
              <div className="work-matrix__list" role="list">
                {workTypes.map((item) => (
                  <button
                    className={selectedService === item.title ? "is-active" : ""}
                    key={item.title}
                    type="button"
                    onMouseEnter={() => setSelectedService(item.title)}
                    onFocus={() => setSelectedService(item.title)}
                    onClick={() => setSelectedService(item.title)}
                    role="listitem"
                    aria-pressed={selectedService === item.title}
                  >
                    <span>{item.number}</span>
                    <strong>{item.title}</strong>
                    <ArrowIcon />
                  </button>
                ))}
              </div>
              <div className="work-matrix__detail" data-reveal>
                <span className="work-matrix__detail-label">Выбранное направление</span>
                <div className="work-matrix__detail-number">
                  {workTypes.find((item) => item.title === selectedService)?.number}
                </div>
                <h3>{selectedService}</h3>
                <p>{workTypes.find((item) => item.title === selectedService)?.text}</p>
                <a href="#contact">
                  Уточнить состав работ <ArrowIcon />
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="process section" id="process">
          <div className="container">
            <SectionHeading
              index="03"
              eyebrow="Работа над объектом"
              title="От задачи до предъявления результата"
              text="Состав этапов зависит от состояния объекта, исходных данных и выбранного формата договора."
            />

            <ol className="process-track">
              {processSteps.map(([number, title, text]) => (
                <li key={number} data-reveal>
                  <div className="process-track__node">
                    <span>{number}</span>
                  </div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="objects section" id="objects">
          <div className="container">
            <SectionHeading
              index="04"
              eyebrow="Объекты"
              title="Кейсы будем показывать через факты"
              text="В прототипе обозначены направления. Адреса, заказчики, сроки, фотографии и результаты появятся после проверки документов и согласования публикации."
            />

            <div className="object-grid">
              {objectDrafts.map((object, index) => (
                <article className="object-card" key={object.type} data-reveal>
                  <div className={`object-card__visual object-card__visual--${index + 1}`}>
                    <span>Материалы на подтверждении</span>
                    <div className="object-card__drawing" aria-hidden="true" />
                  </div>
                  <div className="object-card__meta">
                    <span>{object.type}</span>
                    <span>{object.place}</span>
                  </div>
                  <h3>{object.title}</h3>
                  <p>{object.scope}</p>
                </article>
              ))}
            </div>

            <div className="objects__note" data-reveal>
              <span>Для запуска раздела</span>
              <p>
                Нужны 3–5 объектов с актами или КС-2/КС-3, фактическими сроками, фотографиями и
                разрешением заказчика на упоминание.
              </p>
            </div>
          </div>
        </section>

        <section className="control section section--ink">
          <div className="container control__layout">
            <div className="control__copy" data-reveal>
              <div className="eyebrow eyebrow--light">
                <span className="eyebrow__dot" />
                Контроль проекта
              </div>
              <h2>Заказчик видит состояние объекта, а не собирает его по сообщениям</h2>
              <p>
                В одном рабочем контуре фиксируются контрольные даты, изменения, снабжение,
                качество, документы и решения, которые требуются от участников проекта.
              </p>
              <div className="control__statement">
                Один объект. Один рабочий контур. Понятные сроки и ответственные.
              </div>
            </div>

            <div className="project-console" data-reveal>
              <div className="project-console__head">
                <div>
                  <span>Пример структуры отчёта</span>
                  <strong>Паспорт объекта</strong>
                </div>
                <span className="project-console__status"><i /> Рабочий контур</span>
              </div>
              <div className="project-console__timeline">
                <span className="is-done" />
                <span className="is-done" />
                <span className="is-active" />
                <span />
                <span />
                <span />
              </div>
              <dl>
                <div><dt>График</dt><dd>контрольные даты и отклонения</dd><span>01</span></div>
                <div><dt>Снабжение</dt><dd>заказы, поставки и критические позиции</dd><span>02</span></div>
                <div><dt>Качество</dt><dd>осмотры, замечания и фотофиксация</dd><span>03</span></div>
                <div><dt>Документы</dt><dd>исполнительная документация и готовность к сдаче</dd><span>04</span></div>
              </dl>
            </div>
          </div>
        </section>

        <section className="documents section" id="documents">
          <div className="container">
            <SectionHeading
              index="05"
              eyebrow="Доверие и документы"
              title="Подтверждаем компетенции документами"
              text="В публичную версию войдут только актуальные сведения. Внутренние планы и черновики не заменяют подписанные документы."
            />

            <div className="document-rows">
              <article data-reveal>
                <span>01</span>
                <div><h3>Карточка предприятия</h3><p>Юридические сведения, реквизиты и корпоративные контакты.</p></div>
                <strong className="status status--ready">есть источник</strong>
              </article>
              <article data-reveal>
                <span>02</span>
                <div><h3>Система работы над объектом</h3><p>Процесс от исходных данных и ПСД до производства и сдачи.</p></div>
                <strong className="status status--ready">есть источник</strong>
              </article>
              <article data-reveal>
                <span>03</span>
                <div><h3>СРО, лицензии и специалисты</h3><p>Размещаются после получения и проверки актуального комплекта.</p></div>
                <strong className="status status--review">нужно подтвердить</strong>
              </article>
              <article data-reveal>
                <span>04</span>
                <div><h3>Отзывы и выполненные объекты</h3><p>Публикуются вместе с основанием и разрешением заказчика.</p></div>
                <strong className="status status--review">нужно подтвердить</strong>
              </article>
            </div>
          </div>
        </section>

        <section className="brief section" id="brief">
          <div className="container brief__shell">
            <div className="brief__intro" data-reveal>
              <span className="brief__number">06</span>
              <div className="eyebrow eyebrow--light">
                <span className="eyebrow__dot" />
                Обсудить задачу
              </div>
              <h2>Есть проект, техническое задание или ведомость объёмов?</h2>
              <p>
                Передайте материалы по объекту. Если готовых документов нет — начнём с короткого
                обсуждения и определим, какие данные потребуются.
              </p>
              <div className="brief__direct">
                <a href="tel:+79128352998">+7 912 835-29-98</a>
                <a href="mailto:info@tsk-fort.ru">info@tsk-fort.ru</a>
              </div>
            </div>

            <form className="brief-form" onSubmit={handleSubmit} data-reveal>
              <div className="form-grid">
                <label>
                  <span>Имя *</span>
                  <input name="name" autoComplete="name" required placeholder="Как к вам обращаться" />
                </label>
                <label>
                  <span>Компания</span>
                  <input name="company" autoComplete="organization" placeholder="Название организации" />
                </label>
                <label>
                  <span>Телефон *</span>
                  <input name="phone" type="tel" autoComplete="tel" required placeholder="+7 900 000-00-00" />
                </label>
                <label>
                  <span>Город объекта</span>
                  <input name="city" placeholder="Тюмень" />
                </label>
                <label className="form-grid__wide">
                  <span>Требуемая услуга</span>
                  <select name="service" defaultValue="">
                    <option value="" disabled>Выберите направление</option>
                    <option>Генеральный подряд</option>
                    <option>Проектирование</option>
                    <option>Капитальный ремонт</option>
                    <option>Другая задача</option>
                  </select>
                </label>
                <label className="form-grid__wide">
                  <span>Коротко об объекте</span>
                  <textarea name="message" rows="3" placeholder="Тип объекта, стадия, сроки и исходные данные" />
                </label>
              </div>

              <div className="file-field">
                <label>
                  <PaperclipIcon />
                  <input
                    type="file"
                    name="attachment"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.dwg,.zip"
                    onChange={(event) => setFileName(event.target.files?.[0]?.name || "")}
                  />
                  <span>{fileName || "Прикрепить файл"}</span>
                </label>
                <small>PDF, DOCX, XLSX, DWG или ZIP</small>
              </div>

              <label className="consent-check">
                <input type="checkbox" required />
                <span>
                  Согласен с обработкой персональных данных и условиями
                  {" "}
                  <button type="button" onClick={() => setLegalModal("privacy")}>политики</button>.
                </span>
              </label>

              <button className="button button--accent button--full" type="submit">
                Передать материалы <ArrowIcon />
              </button>
              <p className="form-status" role="status" aria-live="polite">{formStatus}</p>
            </form>
          </div>
        </section>

        <section className="contact section" id="contact">
          <div className="container contact__layout">
            <div className="contact__heading" data-reveal>
              <span>ТСК ФОРТ / ТЮМЕНЬ</span>
              <h2>Обсудим ваш объект</h2>
            </div>
            <div className="contact__details" data-reveal>
              <a href="tel:+79128352998">+7 912 835-29-98</a>
              <a href="mailto:info@tsk-fort.ru">info@tsk-fort.ru</a>
              <address>625019, г. Тюмень,<br />ул. Республики, 204а, офис 404</address>
              <p className="prototype-note">Контакты из карточки предприятия. Перед публикацией требуется финальная сверка.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container site-footer__top">
          <Brand />
          <nav aria-label="Навигация в подвале">
            {navItems.map(([label, href]) => <a key={href} href={href}>{label}</a>)}
          </nav>
        </div>
        <div className="container site-footer__bottom">
          <span>© {new Date().getFullYear()} ООО «ТСК ФОРТ»</span>
          <div>
            <button type="button" onClick={() => setLegalModal("privacy")}>Политика конфиденциальности</button>
            <button type="button" onClick={() => setLegalModal("consent")}>Согласие на обработку ПД</button>
          </div>
          <span>Дизайн-прототип · 01</span>
        </div>
      </footer>

      <dialog
        className="legal-dialog"
        ref={dialogRef}
        onClose={() => setLegalModal(null)}
        onCancel={() => setLegalModal(null)}
      >
        <button className="legal-dialog__close" type="button" aria-label="Закрыть" onClick={() => setLegalModal(null)}>
          <CloseIcon />
        </button>
        <span className="legal-dialog__label">Проект документа</span>
        <h2>{legalModal === "consent" ? "Согласие на обработку персональных данных" : "Политика конфиденциальности"}</h2>
        <p>
          Раздел предусмотрен структурой сайта, но юридический текст ещё не подготовлен. Перед
          публикацией документ нужно составить для фактического оператора сайта, форм обработки,
          подключённой аналитики и способа хранения обращений.
        </p>
        <p className="legal-dialog__warning">Не является готовым юридическим документом.</p>
      </dialog>
    </>
  );
}

export default App;
