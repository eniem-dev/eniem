export interface GitHubBenefit {
  id: string;
  repositoryOwner: string;
  repositoryName: string;
  repositoryUrl: string;
  permission: string;
  isGranted: boolean;
  grantedAt: Date | null;
  description: string;
}

export interface GitHubBenefitsResult {
  benefits: GitHubBenefit[];
}
