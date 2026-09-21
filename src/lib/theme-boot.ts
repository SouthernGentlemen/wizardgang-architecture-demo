/** The only inline executable code in the shared document; it runs before first paint. */
export const THEME_BOOT_SCRIPT = `try{var t=localStorage.getItem('wg-theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`;

/** SHA-256 of THEME_BOOT_SCRIPT. A test verifies this value against rendered HTML. */
export const THEME_BOOT_SHA256 = 'kkEgMHJL1kWpfT75kZZ6+2UXAqAKOLs/xIRz40TozzM=';
