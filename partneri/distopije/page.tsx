import type { Metadata } from "next";
import styles from "./distopije.module.css";
import { DistopijeLightbox } from "./components/DistopijeLightbox";
import { heroPhoto, photos, series } from "./data/photos";

export const metadata: Metadata = {
  title: "Distopije JPG — Photography Portfolio",
  description: "Minimal photography portfolio focused on moments, street scenes and visual atmosphere.",
  icons: {
    icon: "/partneri/distopije/images/favicon.svg"
  },
  openGraph: {
    title: "Distopije JPG — Photography Portfolio",
    description: "Minimal photography portfolio focused on moments, street scenes and visual atmosphere.",
    images: [
      {
        url: "/partneri/distopije/images/hero.svg",
        width: 1600,
        height: 1000,
        alt: "Distopije JPG hero photograph"
      }
    ],
    type: "website"
  }
};

const selectedPhotos = photos.filter((photo) => photo.featured).slice(0, 12);
const momentsPhotos = photos.filter((photo) => photo.series === "Moments");
const streetPhotos = photos.filter((photo) => photo.series === "Street");

export default function DistopijePage() {
  return (
    <article className={`distopije-page ${styles.page}`}>
      <header className={styles.header}>
        <a aria-label="Distopije JPG home" className={styles.logo} href="#top">
          DISTOPIJE JPG
        </a>
        <nav aria-label="Distopije JPG navigation" className={styles.nav}>
          <a href="#moments">Moments</a>
          <a href="#street">Street</a>
          <a href="#series">Series</a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      <section className={styles.hero} id="top">
        <div className={styles.heroImage}>
          <img alt={heroPhoto.alt} decoding="async" fetchPriority="high" src={heroPhoto.src} />
        </div>
        <div className={styles.heroCopy}>
          <p>DISTOPIJE JPG</p>
          <h1>Photography portfolio focused on moments, streets, atmosphere and visual fragments.</h1>
        </div>
      </section>

      <section aria-labelledby="selected-title" className={styles.section}>
        <div className={styles.sectionHead}>
          <p>01</p>
          <h2 id="selected-title">Selected Work</h2>
        </div>
        <div className={`${styles.photoGrid} ${styles.selectedGrid}`}>
          <DistopijeLightbox photos={selectedPhotos} />
        </div>
      </section>

      <section aria-labelledby="moments-title" className={styles.section} id="moments">
        <div className={styles.sectionHead}>
          <p>02</p>
          <div>
            <h2 id="moments-title">MOMENTS</h2>
            <span>Unstaged frames, quiet gestures and fragments of atmosphere.</span>
          </div>
        </div>
        <div className={styles.photoGrid}>
          <DistopijeLightbox photos={momentsPhotos} />
        </div>
      </section>

      <section aria-labelledby="street-title" className={styles.section} id="street">
        <div className={styles.sectionHead}>
          <p>03</p>
          <div>
            <h2 id="street-title">STREET</h2>
            <span>Street scenes, urban details and everyday visual tension.</span>
          </div>
        </div>
        <div className={styles.photoGrid}>
          <DistopijeLightbox photos={streetPhotos} />
        </div>
      </section>

      <section aria-labelledby="series-title" className={styles.section} id="series">
        <div className={styles.sectionHead}>
          <p>04</p>
          <h2 id="series-title">SERIES</h2>
        </div>
        <div className={styles.seriesGrid}>
          {series.map((item) => {
            const cover = photos.find((photo) => photo.id === item.coverId) ?? photos[0];

            return (
              <a className={styles.seriesCard} href={`#${item.anchor}`} key={item.title}>
                <img alt={`${item.title} series cover`} loading="lazy" src={cover.src} />
                <span>{item.title}</span>
                <p>{item.description}</p>
              </a>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="about-title" className={`${styles.section} ${styles.about}`} id="about">
        <div className={styles.sectionHead}>
          <p>05</p>
          <h2 id="about-title">ABOUT</h2>
        </div>
        <div className={styles.aboutGrid}>
          <p>
            Distopije JPG is a photography portfolio built around atmosphere, urban scenes,
            spontaneous moments and visual fragments.
          </p>
          <div>
            <p className={styles.bioNote}>Biography extension space.</p>
            <a href="https://wa.me/38269805302">WhatsApp: +382 69 805 302</a>
            <a href="mailto:distopijejpg@gmail.com">E-mail: distopijejpg@gmail.com</a>
          </div>
        </div>
      </section>

      <section aria-labelledby="contact-title" className={`${styles.section} ${styles.contact}`} id="contact">
        <div className={styles.sectionHead}>
          <p>06</p>
          <h2 id="contact-title">CONTACT</h2>
        </div>
        <div className={styles.contactGrid}>
          <form action="mailto:distopijejpg@gmail.com" className={styles.form} method="post">
            <label>
              Name
              <input name="name" type="text" />
            </label>
            <label>
              Email
              <input name="email" type="email" />
            </label>
            <label>
              Message
              <textarea name="message" rows={5} />
            </label>
            <button type="submit">Send</button>
          </form>
          <aside className={styles.directContact}>
            <p>Direct contact</p>
            <a href="https://wa.me/38269805302">WhatsApp</a>
            <a href="mailto:distopijejpg@gmail.com">Email</a>
          </aside>
        </div>
      </section>
    </article>
  );
}
