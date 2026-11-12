const API = "https://api.github.com";

const PR_QUERY = `query($owner: String!, $name: String!, $number: Int!) {
  repository(owner: $owner, name: $name) {
    pullRequest(number: $number) {
      number title url state isDraft body
      latestOpinionatedReviews(first: 50) { nodes { state } }
      closingIssuesReferences(first: 1) { nodes { number title url } }
    }
  }
}`;

const ITEM_QUERY = `query($owner: String!, $name: String!, $number: Int!) {
  repository(owner: $owner, name: $name) {
    issueOrPullRequest(number: $number) {
      __typename
      ... on Issue {
        number title url state
        assignees(first: 10) { nodes { login } }
        closedByPullRequestsReferences(first: 10, includeClosedPrs: true) { nodes { ...LinkedPr } }
        timelineItems(first: 100, itemTypes: [CROSS_REFERENCED_EVENT, CONNECTED_EVENT]) {
          nodes {
            ... on CrossReferencedEvent { source { ...LinkedPr } }
            ... on ConnectedEvent { subject { ...LinkedPr } }
          }
        }
      }
      ... on PullRequest {
        number title url state isDraft
        assignees(first: 10) { nodes { login } }
      }
    }
  }
}

fragment LinkedPr on PullRequest { number url state isDraft repository { nameWithOwner } }`;

export class GitHubError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export function createClient(token) {
  async function request(path, init = {}) {
    let res;
    try {
      res = await fetch(API + path, {
        ...init,
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
          "X-GitHub-Api-Version": "2022-11-28",
        },
      });
    } catch {
      throw new GitHubError("Network error", 0);
    }
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      const limited = res.headers.get("x-ratelimit-remaining") === "0";
      throw new GitHubError(body.message || res.statusText, limited ? 429 : res.status);
    }
    return body;
  }

  async function graphql(query, { repo, number }, pick) {
    const [owner, name] = repo.split("/");
    const body = await request("/graphql", {
      method: "POST",
      body: JSON.stringify({ query, variables: { owner, name, number } }),
    });
    if (body.errors?.length) {
      const notFound = body.errors.some((e) => e.type === "NOT_FOUND");
      throw new GitHubError(body.errors[0].message, notFound ? 404 : 400);
    }
    const node = body.data?.repository && pick(body.data.repository);
    if (!node) throw new GitHubError("Not Found", 404);
    return node;
  }

  return {
    viewer: () => request("/user"),

    async issue({ repo, number }) {
      const i = await request(`/repos/${repo}/issues/${number}`);
      return { number: i.number, title: i.title, url: i.html_url };
    },

    pull: (ref) => graphql(PR_QUERY, ref, (repo) => repo.pullRequest),

    item: (ref) => graphql(ITEM_QUERY, ref, (repo) => repo.issueOrPullRequest),
  };
}
