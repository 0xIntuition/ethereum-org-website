import React, { useEffect, useState } from "react"
import { graphql, PageProps } from "gatsby"
import { MDXProvider } from "@mdx-js/react"
import { MDXRenderer } from "gatsby-plugin-mdx"
import styled from "@emotion/styled"
import { Badge } from "@chakra-ui/react"
import ButtonLink from "../components/ButtonLink"
import Card from "../components/Card"
import Codeblock from "../components/Codeblock"
import TutorialMetadata from "../components/TutorialMetadata"
import FileContributors from "../components/FileContributors"
import InfoBanner from "../components/InfoBanner"
import Link from "../components/Link"
import MarkdownTable from "../components/MarkdownTable"
import PageMetadata from "../components/PageMetadata"
import TableOfContents, {
  Item as ItemTableOfContents,
} from "../components/TableOfContents"
import SectionNav from "../components/SectionNav"
import CallToContribute from "../components/CallToContribute"
import {
  Divider,
  Paragraph,
  Header1,
  Header2,
  Header3,
  Header4,
  ListItem,
  KBD,
} from "../components/SharedStyledComponents"
import Emoji from "../components/OldEmoji"
import YouTube from "../components/YouTube"
import PostMergeBanner from "../components/Banners/PostMergeBanner"
import FeedbackCard from "../components/FeedbackCard"

import { isLangRightToLeft, TranslationKey } from "../utils/translations"
import { Lang } from "../utils/languages"
import { Context } from "../types"
import {
  ZkConnect,
  ZkConnectClientConfig,
  DataRequest,
} from "@sismo-core/zk-connect-client"
import {
  ZkConnectButton,
  ZkConnectResponse,
} from "@sismo-core/zk-connect-react"
import { request, gql } from "graphql-request"
import { useAccount } from "wagmi"

const Page = styled.div`
  display: flex;
  width: 100%;
  margin: 0 auto;
  padding: 0 2rem 0 0;
  background: ${(props) => props.theme.colors.ednBackground};
  border-bottom: 1px solid ${(props) => props.theme.colors.border};
  background-color: ${(props) => props.theme.colors.ednBackground};
  @media (max-width: ${(props) => props.theme.breakpoints.l}) {
    margin: 2rem 0rem;
    padding: 0;
    background: ${(props) => props.theme.colors.background};
  }
`

const DesktopTableOfContents = styled(TableOfContents)`
  padding-top: 4rem;
`
const MobileTableOfContents = styled(TableOfContents)`
  margin-bottom: 2rem;
`

// Apply styles for classes within markdown here
const ContentContainer = styled.article`
  flex: 1 1 ${(props) => props.theme.breakpoints.m};
  max-width: 1000px;
  background: ${(props) => props.theme.colors.background};
  box-shadow: ${(props) => props.theme.colors.tableBoxShadow};
  margin: 2rem 2rem;
  padding: 4rem 4rem;
  margin-bottom: 6rem;
  border-radius: 4px;
  @media (max-width: ${(props) => props.theme.breakpoints.l}) {
    margin: 2.5rem 0rem;
    padding: 3rem 2rem;
    box-shadow: none;
    width: 100%;
  }

  .featured {
    padding-left: 1rem;
    margin-left: -1rem;
    border-left: 1px dotted ${(props) => props.theme.colors.primary};
  }

  .citation {
    p {
      color: ${(props) => props.theme.colors.text200};
    }
  }
`

const H1 = styled(Header1)`
  font-size: 2.5rem;
  font-family: ${(props) => props.theme.fonts.monospace};
  text-transform: uppercase;
  @media (max-width: ${(props) => props.theme.breakpoints.m}) {
    font-size: 1.75rem;
  }
`

const H2 = styled(Header2)`
  font-family: ${(props) => props.theme.fonts.monospace};
  text-transform: uppercase;
`

const H3 = styled(Header3)`
  @media (max-width: ${(props) => props.theme.breakpoints.m}) {
    font-size: 1rem;
    font-weight: 600;
  }
`
const H4 = styled(Header4)`
  @media (max-width: ${(props) => props.theme.breakpoints.m}) {
    font-size: 1rem;
    font-weight: 600;
  }
`

// Note: you must pass components to MDXProvider in order to render them in markdown files
// https://www.gatsbyjs.com/plugins/gatsby-plugin-mdx/#mdxprovider
const components = {
  a: Link,
  h1: H1,
  h2: H2,
  h3: H3,
  h4: H4,
  p: Paragraph,
  kbd: KBD,
  li: ListItem,
  pre: Codeblock,
  table: MarkdownTable,
  ButtonLink,
  InfoBanner,
  Card,
  Divider,
  SectionNav,
  Badge,
  CallToContribute,
  Emoji,
  YouTube,
}

const Contributors = styled(FileContributors)`
  margin-top: 3rem;
  border: 1px solid ${(props) => props.theme.colors.border};
  background: ${(props) => props.theme.colors.ednBackground};
  padding: 1rem;
  border-radius: 4px;
`

const TutorialPage = ({
  data: { siteData, pageData: mdx },
  pageContext: { relativePath, slug },
}: PageProps<Queries.TutorialPageQuery, Context>) => {
  const { address } = useAccount()
  const [poll, setPoll] = useState<{ prompt: string; options: string[] }>()
  const [pollProofId, setPollProofId] = useState<string | null>(null)
  const [loadingPollProof, setLoadingPollProof] = useState(false)
  const [voting, setVoting] = useState<string>()
  const [voted, setVoted] = useState<string>()
  const [results, setResults] = useState<any>()
  if (!siteData || !mdx?.frontmatter)
    throw new Error(
      "Tutorial page template query does not return expected values"
    )
  if (!mdx?.frontmatter?.title)
    throw new Error("Required `title` property missing for tutorial template")
  if (!relativePath)
    throw new Error("Required `relativePath` is missing on pageContext")

  const isRightToLeft = isLangRightToLeft(mdx.frontmatter.lang as Lang)

  const showPostMergeBanner = !!mdx.frontmatter.postMergeBannerTranslation
  const postMergeBannerTranslationString = mdx.frontmatter
    .postMergeBannerTranslation as TranslationKey | null

  const tocItems = mdx.tableOfContents?.items as Array<ItemTableOfContents>

  const { editContentUrl } = siteData.siteMetadata || {}
  const hideEditButton = !!mdx.frontmatter.hideEditButton
  const absoluteEditPath = `${editContentUrl}${relativePath}`
  const [showingResults, setShowingResults] = useState(false)

  const vote = (poll: string, option: string) => {
    setVoted(option)
    if (address && pollProofId) {
      const body = JSON.stringify({
        poll,
        option,
        proofId: pollProofId,
        address,
      })
      fetch("https://ethporto-hack-api.vercel.app/api/attestToPoll", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body,
      }).then(() => {
        setVoted(option)
      })
    }
  }

  useEffect(() => {
    console.log("ya")
    fetch(
      `https://ethporto-hack-api.vercel.app/api/polls?slug=${encodeURIComponent(
        slug
      )}`
    )
      .then((res) => res.json())
      .then((poll) => {
        console.log("poll", poll)
        if (poll) {
          setPoll(poll)
        }
      })
  }, [])

  useEffect(() => {
    if (poll) {
      const query = gql`
        {
            options(where: { id_in: [${poll.options
              .map((option) => `"${option}"`)
              .join(",")}], poll_: {id: "${slug}"  }}) {
              id
              votes(
                where: {
                  user_: { id: "${address?.toLowerCase()}" }
                }
              ) {
                id
              }
              numVotes
            }
        }
      `

      request(
        "https://api.thegraph.com/subgraphs/name/0xintuition/ep23-graph",
        query
      ).then((data: any) => setResults(data.options))
    }
  }, [poll])

  return (
    <>
      {showPostMergeBanner && (
        <PostMergeBanner
          translationString={postMergeBannerTranslationString!}
        />
      )}
      <Page dir={isRightToLeft ? "rtl" : "ltr"}>
        <PageMetadata
          title={mdx.frontmatter.title}
          description={mdx.frontmatter.description}
          canonicalUrl={mdx.frontmatter.sourceUrl}
        />
        <ContentContainer>
          <H1>{mdx.frontmatter.title}</H1>
          <TutorialMetadata tutorial={mdx} />
          <MobileTableOfContents
            items={tocItems}
            maxDepth={mdx.frontmatter.sidebarDepth!}
            editPath={absoluteEditPath}
            isMobile={true}
          />
          <MDXProvider components={components}>
            <MDXRenderer>{mdx.body}</MDXRenderer>
          </MDXProvider>
          <Contributors
            relativePath={relativePath}
            editPath={absoluteEditPath}
          />
          {/*           <FeedbackCard /> */}

          {poll && (
            <div className="flex flex-col space-y-8 rounded-lg bg-slate-50 border border-slate-200 p-6">
              <div className="flex flex-row items-center justify-between">
                <h1 className="text-xl font-bold">{poll.prompt}</h1>
                {results && (
                  <button onClick={() => setShowingResults(!showingResults)}>
                    {showingResults ? "Hide Results" : "Show Results"}
                  </button>
                )}
              </div>
              <div className="relative">
                <div className="flex flex-col space-y-4">
                  {!showingResults
                    ? poll.options.map((option, i) => (
                        <button
                          onClick={() => {
                            if (!voted) {
                              vote(slug, option)
                            }
                          }}
                          className={`flex flex-row items-center justify-start text-lg rounded-full px-4 py-3 font-semibold my-2 ${
                            voted === option
                              ? "bg-green-100 border border-green-200"
                              : "bg-slate-100 border border-slate-200 hover:bg-slate-200"
                          }`}
                          key={i}
                          disabled={false}
                        >
                          {option}
                        </button>
                      ))
                    : results!.map((option) => (
                        <div className="">
                          {option.id} - {option.numVotes}
                        </div>
                      ))}
                  {}
                </div>
                {!pollProofId && (
                  <div className="absolute top-0 left-0 w-full h-full bg-gray-500/40 flex justify-center items-center z-10">
                    {loadingPollProof ? (
                      <div className="flex flex-col items-center space-y-2">
                        <div className="text-lg font-semibold">
                          Verifying proof...
                        </div>
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                      </div>
                    ) : (
                      <ZkConnectButton
                        dataRequest={DataRequest({
                          // ID of the group the user should be a member of
                          groupId: "0x42c768bb8ae79e4c5c05d3b51a4ec74a",
                        })}
                        callbackPath={slug}
                        config={{
                          appId: "0x7e7fdcd9d2a59667fba943d717de2ff3",
                          devMode: {
                            enabled: true,
                            devAddresses: [
                              "0x69420cc9b83d641470d0fea1cbf1a59d7a83df48",
                            ],
                          },
                        }}
                        onResponse={async (
                          zkConnectResponse: ZkConnectResponse
                        ) => {
                          const body = JSON.stringify({
                            // the proof generated by the user
                            zkConnectResponse,
                          })

                          try {
                            setLoadingPollProof(true)

                            const res = await fetch(
                              "https://ethporto-hack-api.vercel.app/api/verify",
                              {
                                method: "POST",
                                headers: {
                                  "Content-Type": "application/json",
                                },
                                body,
                              }
                            )

                            if (res.ok) {
                              const data = await res.json()
                              const { ok, proofId } = data
                              if (ok && proofId) {
                                setPollProofId(proofId)
                              }
                            }
                            setLoadingPollProof(false)
                          } catch (e) {
                            setLoadingPollProof(false)
                            console.error(e)
                          }
                        }}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </ContentContainer>
        {tocItems && (
          <DesktopTableOfContents
            items={tocItems}
            maxDepth={mdx.frontmatter.sidebarDepth!}
            editPath={absoluteEditPath}
            hideEditButton={hideEditButton}
          />
        )}
      </Page>
    </>
  )
}

export default TutorialPage

export const query = graphql`
  query TutorialPage($languagesToFetch: [String!]!, $relativePath: String) {
    locales: allLocale(
      filter: {
        language: { in: $languagesToFetch }
        ns: { in: ["page-developers-tutorials", "common"] }
      }
    ) {
      edges {
        node {
          ns
          data
          language
        }
      }
    }
    siteData: site {
      siteMetadata {
        editContentUrl
      }
    }
    pageData: mdx(fields: { relativePath: { eq: $relativePath } }) {
      fields {
        slug
        readingTime {
          minutes
        }
      }
      frontmatter {
        title
        description
        lang
        tags
        author
        source
        sourceUrl
        skill
        published
        sidebarDepth
        address
        isOutdated
        postMergeBannerTranslation
        hideEditButton
      }
      body
      tableOfContents
    }
  }
`
