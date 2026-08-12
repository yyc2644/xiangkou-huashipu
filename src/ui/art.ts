type IconOptions = {
  size?: "tiny" | "small" | "large";
  label?: string;
  color?: string;
};

const sizeClass = (size: IconOptions["size"] = "small") => `art-icon art-${size}`;

const svg = (body: string, className: string, label: string, extra = "") => `
  <svg class="${className}" viewBox="0 0 64 64" role="img" aria-label="${label}" ${extra}>
    ${body}
  </svg>
`;

const plate = (fill = "#fff7dc") => `<ellipse cx="32" cy="48" rx="23" ry="8" fill="#000" opacity=".08"/><ellipse cx="32" cy="45" rx="24" ry="10" fill="${fill}" stroke="#8f6b45" stroke-width="2"/>`;

const genericLeaf = `
  <path d="M13 45c10-22 25-31 41-31-3 17-13 31-36 35 10-6 18-14 26-26-12 9-21 17-31 22z" fill="#6fbd68" stroke="#376f43" stroke-width="2"/>
  <path d="M20 43c9-5 17-12 25-21" fill="none" stroke="#eff8d7" stroke-width="2" stroke-linecap="round"/>
`;

export const artIcon = (key: string, options: IconOptions = {}) => {
  const cls = sizeClass(options.size);
  const label = options.label ?? key;
  const color = options.color ?? "#80b96c";

  switch (key) {
    case "board_nav":
      return svg(
        `
        <rect x="13" y="13" width="38" height="38" rx="7" fill="#f8f0df" stroke="#6f806f" stroke-width="3"/>
        <path d="M32 13v38M13 32h38" stroke="#9db18f" stroke-width="2"/>
        <rect x="17" y="17" width="11" height="11" rx="3" fill="#8fd26b" stroke="#3f7e45" stroke-width="1.5"/>
        <rect x="36" y="17" width="11" height="11" rx="3" fill="#f4cf71" stroke="#a87939" stroke-width="1.5"/>
        <rect x="17" y="36" width="11" height="11" rx="3" fill="#9bdaf0" stroke="#237b9b" stroke-width="1.5"/>
        <rect x="36" y="36" width="11" height="11" rx="3" fill="#ef8d84" stroke="#9a3438" stroke-width="1.5"/>
        `,
        cls,
        label,
      );

    case "order_nav":
      return svg(
        `
        <path d="M18 10h28l4 7v37H14V17l4-7z" fill="#fff8e8" stroke="#8f6b45" stroke-width="3"/>
        <path d="M18 18h28M22 29h20M22 38h16M22 47h12" stroke="#bd8c52" stroke-width="3" stroke-linecap="round"/>
        <circle cx="44" cy="45" r="7" fill="#f0bf3e" stroke="#a17c22" stroke-width="2"/>
        `,
        cls,
        label,
      );

    case "atlas_nav":
      return svg(
        `
        <path d="M13 18l13-5 13 5 12-5v38l-12 5-13-5-13 5V18z" fill="#eff7eb" stroke="#5f7a65" stroke-width="3" stroke-linejoin="round"/>
        <path d="M26 13v38M39 18v38" stroke="#a8bea2" stroke-width="2"/>
        <path d="M20 39c7-13 16-16 25-9" fill="none" stroke="#3e7c68" stroke-width="3" stroke-linecap="round"/>
        <circle cx="20" cy="39" r="4" fill="#df6f63"/>
        <circle cx="45" cy="30" r="4" fill="#df6f63"/>
        `,
        cls,
        label,
      );

    case "leaf":
    case "sprout":
    case "greens":
    case "bok":
    case "jade":
      return svg(
        `
        <ellipse cx="32" cy="50" rx="19" ry="6" fill="#000" opacity=".08"/>
        <path d="M20 47c-6-15-2-28 10-35 9 9 9 24-1 37" fill="#8fd26b" stroke="#3f7e45" stroke-width="2"/>
        <path d="M34 49c-2-16 4-29 17-35 6 12 2 26-12 36" fill="#5fb95f" stroke="#2f7542" stroke-width="2"/>
        <path d="M29 45c2-9 3-19 1-29M38 45c4-9 7-18 12-27" stroke="#eef8d9" stroke-width="2" stroke-linecap="round"/>
        `,
        cls,
        label,
      );

    case "dot":
    case "tomato":
    case "sweet":
    case "tomato_basket":
    case "tomato_crate":
      return svg(
        `
        <ellipse cx="32" cy="50" rx="19" ry="6" fill="#000" opacity=".08"/>
        <circle cx="31" cy="34" r="18" fill="#ef5f55" stroke="#9a3438" stroke-width="2"/>
        <circle cx="25" cy="28" r="5" fill="#ff998d" opacity=".7"/>
        <path d="M28 18c2-5 7-8 13-7-2 5-6 8-12 9" fill="#5aa65a" stroke="#356f3e" stroke-width="2"/>
        <path d="M33 18c-6-2-10-5-11-10 6 0 10 3 13 9" fill="#6ebd62" stroke="#356f3e" stroke-width="2"/>
        `,
        cls,
        label,
      );

    case "egg":
    case "double":
    case "goldbox":
      return svg(
        `
        ${plate("#fff6d7")}
        <ellipse cx="25" cy="35" rx="11" ry="15" fill="#fff7de" stroke="#c9a15d" stroke-width="2"/>
        <ellipse cx="39" cy="35" rx="11" ry="15" fill="#fff0bd" stroke="#c9a15d" stroke-width="2"/>
        <circle cx="39" cy="37" r="5" fill="#f4b647"/>
        `,
        cls,
        label,
      );

    case "wheat":
      return svg(
        `
        <ellipse cx="32" cy="51" rx="18" ry="5" fill="#000" opacity=".08"/>
        <path d="M32 53V12" stroke="#9d7131" stroke-width="3" stroke-linecap="round"/>
        <path d="M31 17c-8-3-10-8-8-13 7 2 10 6 8 13zM33 17c8-3 10-8 8-13-7 2-10 6-8 13zM31 29c-8-3-11-8-9-14 8 2 11 7 9 14zM33 29c8-3 11-8 9-14-8 2-11 7-9 14zM31 41c-8-3-10-8-8-13 7 2 10 6 8 13zM33 41c8-3 10-8 8-13-7 2-10 6-8 13z" fill="#e5b85d" stroke="#9d7131" stroke-width="1.5"/>
        `,
        cls,
        label,
      );

    case "flour":
      return svg(
        `
        <ellipse cx="32" cy="50" rx="19" ry="6" fill="#000" opacity=".08"/>
        <path d="M18 22h28l4 28H14l4-28z" fill="#f4dfaa" stroke="#a87939" stroke-width="2"/>
        <path d="M21 22c1-7 21-7 22 0" fill="#fff1cc" stroke="#a87939" stroke-width="2"/>
        <circle cx="32" cy="36" r="8" fill="#fff8e2"/>
        `,
        cls,
        label,
      );

    case "dough":
    case "rise":
    case "soft":
      return svg(
        `
        ${plate("#fff1c9")}
        <path d="M17 38c4-12 14-17 28-14 8 7 7 18-3 22-12 5-27 1-25-8z" fill="#dcae62" stroke="#8c6335" stroke-width="2"/>
        <path d="M26 31c4-2 9-2 14 1" stroke="#f9db9f" stroke-width="3" stroke-linecap="round"/>
        `,
        cls,
        label,
      );

    case "bud":
    case "daisy":
    case "bunch":
    case "florist":
    case "goldflower":
      return svg(
        `
        <ellipse cx="32" cy="51" rx="18" ry="5" fill="#000" opacity=".08"/>
        <path d="M32 50V31" stroke="#4f8b4d" stroke-width="3" stroke-linecap="round"/>
        <path d="M29 43c-8-3-12-8-13-15 9 1 14 6 16 15" fill="#70bc68" stroke="#397b43" stroke-width="2"/>
        <path d="M35 43c8-3 12-8 13-15-9 1-14 6-16 15" fill="#83cc70" stroke="#397b43" stroke-width="2"/>
        <g transform="translate(32 24)">
          <ellipse cx="0" cy="-10" rx="6" ry="10" fill="#fff9c9" stroke="#c5a83e" stroke-width="1.5"/>
          <ellipse cx="9" cy="-4" rx="6" ry="10" fill="#fff9c9" stroke="#c5a83e" stroke-width="1.5" transform="rotate(55 9 -4)"/>
          <ellipse cx="6" cy="8" rx="6" ry="10" fill="#fff9c9" stroke="#c5a83e" stroke-width="1.5" transform="rotate(125 6 8)"/>
          <ellipse cx="-6" cy="8" rx="6" ry="10" fill="#fff9c9" stroke="#c5a83e" stroke-width="1.5" transform="rotate(55 -6 8)"/>
          <ellipse cx="-9" cy="-4" rx="6" ry="10" fill="#fff9c9" stroke="#c5a83e" stroke-width="1.5" transform="rotate(125 -9 -4)"/>
          <circle cx="0" cy="0" r="6" fill="#f0bf3e" stroke="#a17c22" stroke-width="1.5"/>
        </g>
        `,
        cls,
        label,
      );

    case "rosebud":
    case "rose":
    case "roses":
    case "rosebox":
    case "royal":
      return svg(
        `
        <ellipse cx="32" cy="51" rx="18" ry="5" fill="#000" opacity=".08"/>
        <path d="M33 51V32" stroke="#447d46" stroke-width="3" stroke-linecap="round"/>
        <path d="M31 43c-7-2-11-6-13-12 8 0 13 4 15 12" fill="#65b760" stroke="#397b43" stroke-width="2"/>
        <path d="M33 32c-13-6-12-21 0-25 11 4 14 19 0 25z" fill="#ef86a5" stroke="#a93462" stroke-width="2"/>
        <path d="M24 23c5-6 12-8 19-5M27 15c5 2 9 5 12 11" fill="none" stroke="#ffd3df" stroke-width="2" stroke-linecap="round"/>
        `,
        cls,
        label,
      );

    case "paper":
    case "box":
    case "gift":
    case "ribbonbox":
    case "luxury":
      return svg(
        `
        <ellipse cx="32" cy="51" rx="19" ry="6" fill="#000" opacity=".08"/>
        <path d="M15 26h34v25H15z" fill="#f2d39f" stroke="#8c6335" stroke-width="2"/>
        <path d="M12 20h40v10H12z" fill="#f9e0b4" stroke="#8c6335" stroke-width="2"/>
        <path d="M30 20h6v31h-6z" fill="#df6f63"/>
        <path d="M22 18c-4-8 6-10 10 2M42 18c4-8-6-10-10 2" fill="none" stroke="#df6f63" stroke-width="4" stroke-linecap="round"/>
        `,
        cls,
        label,
      );

    case "line":
    case "ribbon":
    case "bow":
    case "flowerbow":
    case "silk":
      return svg(
        `
        <ellipse cx="32" cy="50" rx="18" ry="5" fill="#000" opacity=".08"/>
        <path d="M31 32C16 18 8 28 14 39c7 6 15 2 17-7z" fill="#75c4e4" stroke="#237b9b" stroke-width="2"/>
        <path d="M33 32c15-14 23-4 17 7-7 6-15 2-17-7z" fill="#9bdaf0" stroke="#237b9b" stroke-width="2"/>
        <circle cx="32" cy="33" r="7" fill="#3da7cc" stroke="#237b9b" stroke-width="2"/>
        <path d="M27 39l-7 13M38 39l8 13" stroke="#237b9b" stroke-width="4" stroke-linecap="round"/>
        `,
        cls,
        label,
      );

    case "bao":
      return svg(
        `
        ${plate("#f1dfbd")}
        <path d="M16 38c0-13 9-22 17-22 9 0 16 9 16 22 0 10-33 10-33 0z" fill="#fff2d5" stroke="#a77b4c" stroke-width="2"/>
        <path d="M25 27c2 5 0 9-5 12M32 24c0 6 0 11 0 17M39 27c-2 5 0 9 5 12" fill="none" stroke="#d3aa72" stroke-width="2" stroke-linecap="round"/>
        `,
        cls,
        label,
      );

    case "panegg":
      return svg(
        `
        <path d="M14 42h28c8 0 8 10 0 10H14c-8 0-8-10 0-10z" fill="#5c5c5c" stroke="#333" stroke-width="2"/>
        <path d="M43 46h15" stroke="#333" stroke-width="5" stroke-linecap="round"/>
        <path d="M18 28c10-9 28-5 28 8 0 8-8 11-18 10-12-1-18-10-10-18z" fill="#ffeec1" stroke="#c98d45" stroke-width="2"/>
        <circle cx="32" cy="36" r="8" fill="#f2b642" stroke="#b8782e" stroke-width="2"/>
        <circle cx="23" cy="31" r="5" fill="#ef5f55"/>
        `,
        cls,
        label,
      );

    case "pancake":
      return svg(
        `
        ${plate("#ffe3a3")}
        <circle cx="32" cy="34" r="18" fill="#d7b95e" stroke="#8c6335" stroke-width="2"/>
        <path d="M21 32c8-7 17-7 26 0M22 40c7 4 15 4 24 0" fill="none" stroke="#f4d887" stroke-width="3" stroke-linecap="round"/>
        <path d="M26 24l-6-9M38 23l7-9" stroke="#609b5c" stroke-width="3" stroke-linecap="round"/>
        `,
        cls,
        label,
      );

    case "morninggift":
      return svg(
        `
        <ellipse cx="32" cy="51" rx="20" ry="6" fill="#000" opacity=".08"/>
        <path d="M16 28h32v23H16z" fill="#f0df8d" stroke="#8f6b45" stroke-width="2"/>
        <path d="M31 28h6v23h-6z" fill="#dc766a"/>
        <path d="M18 22h28v9H18z" fill="#fff1b4" stroke="#8f6b45" stroke-width="2"/>
        <path d="M17 21c6-13 13-10 17 3 4-13 12-16 17-3" fill="none" stroke="#dc766a" stroke-width="4" stroke-linecap="round"/>
        <circle cx="20" cy="18" r="5" fill="#fff6cd" stroke="#c5a83e" stroke-width="1.5"/>
        <circle cx="47" cy="18" r="5" fill="#ffd0df" stroke="#a93462" stroke-width="1.5"/>
        `,
        cls,
        label,
      );

    case "bento":
      return svg(
        `
        <ellipse cx="32" cy="51" rx="21" ry="6" fill="#000" opacity=".08"/>
        <rect x="13" y="18" width="38" height="31" rx="7" fill="#f2b37c" stroke="#8f5e3d" stroke-width="2"/>
        <path d="M13 30h38M31 18v31" stroke="#8f5e3d" stroke-width="2"/>
        <circle cx="22" cy="39" r="6" fill="#fff2d5"/>
        <circle cx="41" cy="39" r="5" fill="#ef5f55"/>
        <path d="M36 26c5-5 10-5 13 0" stroke="#6ebd62" stroke-width="4" stroke-linecap="round"/>
        <path d="M20 25c3 1 6 1 9 0" stroke="#6ebd62" stroke-width="4" stroke-linecap="round"/>
        `,
        cls,
        label,
      );

    case "rosegift":
      return svg(
        `
        <ellipse cx="32" cy="51" rx="21" ry="6" fill="#000" opacity=".08"/>
        <rect x="15" y="25" width="34" height="24" rx="5" fill="#ffe1ea" stroke="#9a4f68" stroke-width="2"/>
        <path d="M31 25h6v24h-6zM15 33h34" fill="#e7608e" stroke="#9a4f68" stroke-width="2"/>
        <path d="M25 23c-10-8-3-17 7-6 10-11 17-2 7 6" fill="#ef86a5" stroke="#9a4f68" stroke-width="2"/>
        <path d="M21 45c7-5 16-5 23 0" stroke="#fff8d7" stroke-width="3" stroke-linecap="round"/>
        `,
        cls,
        label,
      );

    case "veg":
      return svg(
        `
        <ellipse cx="32" cy="51" rx="23" ry="7" fill="#000" opacity=".08"/>
        <path d="M14 28h36l-4 22H18z" fill="#c99558" stroke="#7b5a38" stroke-width="2"/>
        <path d="M19 30c3-16 24-16 27 0" fill="none" stroke="#7b5a38" stroke-width="4" stroke-linecap="round"/>
        <circle cx="25" cy="30" r="7" fill="#ef5f55"/>
        <path d="M31 31c4-10 11-15 19-13-2 9-8 14-18 15" fill="#74bd62" stroke="#397b43" stroke-width="2"/>
        <path d="M17 34c8-8 16-10 25-6" stroke="#f4d887" stroke-width="3" stroke-linecap="round"/>
        `,
        cls,
        label,
      );

    case "flower":
      return svg(
        `
        <ellipse cx="32" cy="51" rx="22" ry="7" fill="#000" opacity=".08"/>
        <path d="M15 31h34l-5 20H20z" fill="#cf9f69" stroke="#7b5a38" stroke-width="2"/>
        <path d="M20 31c5-15 20-15 25 0" fill="none" stroke="#7b5a38" stroke-width="4" stroke-linecap="round"/>
        <path d="M26 47V25M38 47V22" stroke="#4f8b4d" stroke-width="3" stroke-linecap="round"/>
        <circle cx="25" cy="22" r="8" fill="#fff6c4" stroke="#c5a83e" stroke-width="2"/>
        <circle cx="39" cy="19" r="8" fill="#ef86a5" stroke="#a93462" stroke-width="2"/>
        `,
        cls,
        label,
      );

    case "crate":
      return svg(
        `
        <ellipse cx="32" cy="51" rx="22" ry="7" fill="#000" opacity=".08"/>
        <rect x="13" y="22" width="38" height="28" rx="4" fill="#b78958" stroke="#6f4d31" stroke-width="2"/>
        <path d="M13 31h38M22 22v28M42 22v28M18 40h28" stroke="#6f4d31" stroke-width="2"/>
        <path d="M23 18h18v8H23z" fill="#e6d1a7" stroke="#6f4d31" stroke-width="2"/>
        `,
        cls,
        label,
      );

    case "steamer":
      return svg(
        `
        <ellipse cx="32" cy="50" rx="22" ry="7" fill="#000" opacity=".08"/>
        <ellipse cx="32" cy="22" rx="21" ry="8" fill="#c9985f" stroke="#6f4d31" stroke-width="2"/>
        <path d="M12 22h40v23c0 6-40 6-40 0z" fill="#d9ad70" stroke="#6f4d31" stroke-width="2"/>
        <path d="M15 32h34M15 41h34" stroke="#8f633d" stroke-width="2"/>
        <path d="M25 13c-4-6 4-8 1-13M34 13c-4-6 4-8 1-13M43 13c-4-6 4-8 1-13" stroke="#fff4d6" stroke-width="3" stroke-linecap="round" opacity=".9"/>
        `,
        cls,
        label,
      );

    case "pan":
      return svg(
        `
        <ellipse cx="27" cy="42" rx="20" ry="12" fill="#4f5656" stroke="#2d3333" stroke-width="2"/>
        <path d="M44 42h15" stroke="#2d3333" stroke-width="6" stroke-linecap="round"/>
        <circle cx="25" cy="38" r="8" fill="#fff2d5"/>
        <circle cx="25" cy="38" r="4" fill="#f2b642"/>
        <path d="M34 31c7 3 10 7 8 12" stroke="#c8d27a" stroke-width="4" stroke-linecap="round"/>
        `,
        cls,
        label,
      );

    case "gift_table":
      return svg(
        `
        <ellipse cx="32" cy="52" rx="22" ry="6" fill="#000" opacity=".08"/>
        <path d="M14 28h36v18H14z" fill="#bf875b" stroke="#6f4d31" stroke-width="2"/>
        <path d="M19 46v10M45 46v10" stroke="#6f4d31" stroke-width="4" stroke-linecap="round"/>
        <rect x="23" y="14" width="18" height="17" rx="3" fill="#f0df8d" stroke="#8f6b45" stroke-width="2"/>
        <path d="M32 14v17M23 22h18" stroke="#dc766a" stroke-width="3"/>
        `,
        cls,
        label,
      );

    case "neighbor":
    case "student":
    case "coder":
    case "gardener":
    case "planner":
    case "courier":
      return svg(
        `
        <circle cx="32" cy="32" r="28" fill="${color}" opacity=".18"/>
        <circle cx="32" cy="24" r="12" fill="#f4c6a1" stroke="#8f6b45" stroke-width="2"/>
        <path d="M17 55c2-14 9-22 15-22s13 8 15 22" fill="${color}" stroke="#6c5a48" stroke-width="2"/>
        <path d="M22 21c4-10 18-11 22 0-8 1-14-1-22 0z" fill="#5b4a39"/>
        <circle cx="28" cy="25" r="1.6" fill="#3d342c"/>
        <circle cx="36" cy="25" r="1.6" fill="#3d342c"/>
        <path d="M28 31c3 3 6 3 9 0" fill="none" stroke="#8f6b45" stroke-width="2" stroke-linecap="round"/>
        `,
        cls,
        label,
      );

    default:
      return svg(genericLeaf, cls, label);
  }
};
