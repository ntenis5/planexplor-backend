// File: @types/express-async-errors.d.ts

/**
 * Ky modul injekton logjikën e kapjes së gabimeve (error handling) 
 * në prototipin e Express.Router. 
 * Deklarata manuale e modulit shmang nevojën për instalimin e @types/express-async-errors,
 * e cila vazhdimisht shkakton gabime 404/ETARGET gjatë instalimit të npm.
 */
declare module 'express-async-errors' {
  /**
   * Moduli eksporton drejtpërdrejt një funksion që ekzekutohet
   * për të modifikuar Express.
   */
  function expressAsyncErrors(): void;

  // Përdorimi i `export =` siguron përputhshmëri me mënyrën
  // sesi moduli importohet në JavaScript.
  export = expressAsyncErrors;
}
