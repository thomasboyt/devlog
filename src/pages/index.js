import React from 'react';
import Link from 'gatsby-link';
import get from 'lodash/get';
import Helmet from 'react-helmet';

class BlogIndex extends React.Component {
  render() {
    const siteTitle = get(this, 'props.data.site.siteMetadata.title');
    const posts = get(this, 'props.data.allMarkdownRemark.edges');

    return (
      <div>
        <Helmet title={siteTitle} />

        {posts.map(({ node }) => {
          const title = get(node, 'frontmatter.title') || node.fields.slug;

          return (
            <div key={node.fields.slug} style={{ marginBottom: '1.5em' }}>
              <h3 style={{ marginBottom: '.5em' }}>
                <small>{node.fields.date}:</small>{' '}
                <Link style={{ boxShadow: 'none' }} to={node.fields.slug}>
                  {title}
                </Link>
              </h3>
              <span
                dangerouslySetInnerHTML={{ __html: node.frontmatter.summary }}
              />
            </div>
          );
        })}
      </div>
    );
  }
}

export default BlogIndex;

export const pageQuery = graphql`
  query IndexQuery {
    site {
      siteMetadata {
        title
      }
    }
    allMarkdownRemark(sort: { fields: [fields___date], order: DESC }) {
      edges {
        node {
          excerpt
          fields {
            slug
            date(formatString: "MMM DD, YYYY")
          }
          frontmatter {
            title
            summary
          }
        }
      }
    }
  }
`;
