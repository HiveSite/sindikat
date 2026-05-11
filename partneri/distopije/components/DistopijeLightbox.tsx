"use client";

import { useEffect, useState } from "react";
import styles from "../distopije.module.css";
import type { PortfolioPhoto } from "../data/photos";

type DistopijeLightboxProps = {
  photos: PortfolioPhoto[];
};

export function DistopijeLightbox({ photos }: DistopijeLightboxProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeIndex = photos.findIndex((photo) => photo.id === activeId);
  const activePhoto = activeIndex >= 0 ? photos[activeIndex] : null;

  useEffect(() => {
    if (!activePhoto) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveId(null);
      }

      if (event.key === "ArrowRight") {
        setActiveId(photos[(activeIndex + 1) % photos.length].id);
      }

      if (event.key === "ArrowLeft") {
        setActiveId(photos[(activeIndex - 1 + photos.length) % photos.length].id);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeIndex, activePhoto, photos]);

  return (
    <>
      {photos.map((photo, index) => (
        <button
          className={`${styles.photoTile} ${styles[photo.orientation]} ${
            photo.featured ? styles.featuredTile : ""
          }`}
          key={photo.id}
          onClick={() => setActiveId(photo.id)}
          type="button"
        >
          <img
            alt={photo.alt}
            decoding="async"
            loading={index < 4 ? "eager" : "lazy"}
            src={photo.src}
          />
          <span>
            <strong>{photo.title}</strong>
            <small>{photo.series}</small>
          </span>
        </button>
      ))}

      {activePhoto ? (
        <div
          aria-label={`${activePhoto.title} lightbox`}
          aria-modal="true"
          className={styles.lightbox}
          role="dialog"
        >
          <button
            aria-label="Close image"
            className={styles.lightboxBackdrop}
            onClick={() => setActiveId(null)}
            type="button"
          />
          <div className={styles.lightboxPanel}>
            <button
              aria-label="Previous image"
              className={`${styles.lightboxControl} ${styles.lightboxPrev}`}
              onClick={() => setActiveId(photos[(activeIndex - 1 + photos.length) % photos.length].id)}
              type="button"
            >
              Prev
            </button>
            <img alt={activePhoto.alt} src={activePhoto.src} />
            <div className={styles.lightboxCaption}>
              <span>{activePhoto.series}</span>
              <strong>{activePhoto.title}</strong>
            </div>
            <button
              aria-label="Next image"
              className={`${styles.lightboxControl} ${styles.lightboxNext}`}
              onClick={() => setActiveId(photos[(activeIndex + 1) % photos.length].id)}
              type="button"
            >
              Next
            </button>
            <button
              aria-label="Close image"
              className={styles.lightboxClose}
              onClick={() => setActiveId(null)}
              type="button"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
