import { useEffect } from 'react'
import { buildCanonicalUrl, seoDefaults } from '../../seo'

type PageSeoProps = {
  title: string
  description: string
  pathname: string
  noindex?: boolean
}

function upsertMeta(
  key: string,
  content: string,
  attr: 'name' | 'property' = 'name',
) {
  const selector = `meta[${attr}="${key}"]`
  let el = document.querySelector(selector)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertLink(rel: string, href: string) {
  const selector = `link[rel="${rel}"]`
  let el = document.querySelector(selector)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

export function PageSeo({ title, description, pathname, noindex }: PageSeoProps) {
  useEffect(() => {
    const canonical = buildCanonicalUrl(pathname)
    const image = `${seoDefaults.siteUrl.replace(/\/$/, '')}${seoDefaults.ogImage}`

    document.title = title

    upsertMeta('description', description)
    upsertMeta('keywords', seoDefaults.keywords)
    upsertMeta('author', seoDefaults.siteName)
    upsertMeta('robots', noindex ? 'noindex, nofollow' : 'index, follow')

    upsertMeta('og:type', 'website', 'property')
    upsertMeta('og:site_name', seoDefaults.siteName, 'property')
    upsertMeta('og:title', title, 'property')
    upsertMeta('og:description', description, 'property')
    upsertMeta('og:url', canonical, 'property')
    upsertMeta('og:image', image, 'property')
    upsertMeta('og:locale', seoDefaults.locale, 'property')

    upsertMeta('twitter:card', 'summary_large_image')
    upsertMeta('twitter:title', title)
    upsertMeta('twitter:description', description)
    upsertMeta('twitter:image', image)

    upsertLink('canonical', canonical)
  }, [title, description, pathname, noindex])

  return null
}
