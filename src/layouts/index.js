import React from 'react';
import Link from 'gatsby-link';

import 'prismjs/themes/prism.css';
import '../styles/normalize.css';
import '../styles/global.css';

import styles from './layout.module.css';

class Template extends React.Component {
  render() {
    const { location, children } = this.props;
    let header;
    if (location.pathname === '/') {
      header = (
        <h1>
          <Link to={'/'}>devlog.disco.zone</Link>
        </h1>
      );
    } else {
      header = (
        <h3>
          <Link to={'/'}>devlog.disco.zone</Link>
        </h3>
      );
    }
    return (
      <div className={styles.container}>
        {header}
        {children()}
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
