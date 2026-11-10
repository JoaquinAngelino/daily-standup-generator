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

  return {
    viewer: () => request("/user"),

    async issue({ repo, number }) {
      const i = await request(`/repos/${repo}/issues/${number}`);
      return { number: i.number, title: i.title, url: i.html_url };
    },

    async pull({ repo, number }) {
      const [owner, name] = repo.split("/");
      const body = await request("/graphql", {
        method: "POST",
        body: JSON.stringify({ query: PR_QUERY, variables: { owner, name, number } }),
      });
      if (body.errors?.length) {
        const notFound = body.errors.some((e) => e.type === "NOT_FOUND");
        throw new GitHubError(body.errors[0].message, notFound ? 404 : 400);
      }
      const pr = body.data?.repository?.pullRequest;
      if (!pr) throw new GitHubError("Not Found", 404);
      return pr;
    },
  };
}
