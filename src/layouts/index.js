import React from 'react';
import Link from 'gatsby-link';

import 'prismjs/themes/prism.css';
import '../styles/normalize.css';
import '../styles/global.css';

import styles from './layout.module.css';

class Template extends React.Component {
  render() {
    const { children } = this.props;

    const header = (
      <header className={styles.header}>
        <Link to={'/'} style={{ fontWeight: 'bold' }}>
          devlog
        </Link>
        <div style={{ float: 'right' }}>
          <a href="https://disco.zone">disco.zone</a>
        </div>
      </header>
    );

    const footer = (
      <footer className={styles.footer}>
        (c) <a href="https://thomasboyt.com">Thomas Boyt</a>
      </footer>
    );

    return (
      <div className={styles.container}>
        {header}
        {children()}
        {footer}
      </div>
    );
  }
}

Template.propTypes = {
  children: React.PropTypes.func,
  location: React.PropTypes.object,
  route: React.PropTypes.object,
};

export default Template;
