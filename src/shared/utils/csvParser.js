export function parseCsvContent(text) {
  const rows = [];
  let current = [];
  let field = '';
  let inQuotes = false;

  const pushField = () => {
    current.push(field);
    field = '';
  };

  const pushRow = () => {
    if (current.length > 0 || field !== '') {
      pushField();
      rows.push(current);
    }
    current = [];
  };

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          field += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ';') {
      pushField();
    } else if (char === '\n') {
      pushRow();
    } else if (char === '\r') {
      if (nextChar === '\n') {
        pushRow();
        index += 1;
      } else {
        pushRow();
      }
    } else {
      field += char;
    }
  }

  if (field !== '' || current.length) {
    pushField();
    rows.push(current);
  }

  return rows.filter((row) => row.some((value) => value.trim() !== ''));
}
