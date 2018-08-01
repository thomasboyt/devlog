import React from 'react';
import Helmet from 'react-helmet';
import Link from 'gatsby-link';
import get from 'lodash/get';

class BlogPostTemplate extends React.Component {
  render() {
    const post = this.props.data.markdownRemark;
    const siteTitle = get(this.props, 'data.site.siteMetadata.title');

    return (
      <div>
        <Helmet title={`${post.frontmatter.title} | ${siteTitle}`} />
        <div>
          <div>{post.fields.date}:</div>
          <h1 style={{ marginTop: '0px' }}>{post.frontmatter.title}</h1>
        </div>
        <div dangerouslySetInnerHTML={{ __html: post.html }} />
      </div>
    );
  }
}

export default BlogPostTemplate;

export const pageQuery = graphql`
  query BlogPostBySlug($slug: String!) {
    site {
      siteMetadata {
        title
        author
      }
    }
    markdownRemark(fields: { slug: { eq: $slug } }) {
      id
      html
      fields {
        date(formatString: "MMMM DD, YYYY")
      }
      frontmatter {
        title
      }
    }
  }
`;
