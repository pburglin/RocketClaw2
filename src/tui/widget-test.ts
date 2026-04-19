import blessed = require('blessed');

const screen = blessed.screen({
  smartCSR: true,
  fullUnicode: true
});

const text = blessed.text({
  top: 0,
  left: 0,
  width: '100%',
  height: 1,
  content: ' Test Status ',
  style: {
    bg: 'blue',
    fg: 'white',
    bold: true
  }
});

const box = blessed.box({
  top: 1,
  left: 0,
  width: '50%',
  height: '30%',
  border: {
    type: 'line'
  },
  style: {
    fg: 'white',
    border: {
      fg: '#ffffff'
    }
  },
  label: ' Test Box '
});

const list = blessed.list({
  top: '31%',
  left: 0,
  width: '70%',
  height: '60%',
  border: {
    type: 'line'
  },
  style: {
    fg: 'white',
    bg: 'black',
    selected: {
      bg: 'blue'
    }
  },
  label: ' Test List ',
  mouse: true,
  keys: true,
  vi: true,
  scrollbar: {
    ch: ' '
  }
});

const textbox = blessed.textbox({
  top: '31%',
  left: '70%',
  width: '30%',
  height: '10%',
  border: {
    type: 'line'
  },
  style: {
    fg: 'white',
    border: {
      fg: '#ffffff'
    }
  },
  label: ' Input › ',
  placeholder: 'Type message and press Enter...',
  mouse: true,
  keys: true
});

const logbox = blessed.box({
  top: '41%',
  left: 0,
  width: '100%',
  height: '18%',
  border: {
    type: 'line'
  },
  style: {
    fg: 'white',
    border: {
      fg: '#ffffff'
    }
  },
  label: ' System Logs '
});

screen.append(text);
screen.append(box);
screen.append(list);
screen.append(textbox);
screen.append(logbox);

screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0);
});

list.addItem('Item 1');
list.addItem('Item 2');
list.addItem('Item 3');
list.select(0);

screen.render();