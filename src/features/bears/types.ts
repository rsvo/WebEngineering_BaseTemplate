export interface Bear {
  id: string;
  name: string;
  binomial: string;
  fileName: string | null;
  range: string;
}

export interface BearWithImage {
  id: string;
  name: string;
  binomial: string;
  range: string;
  image: string;
}
