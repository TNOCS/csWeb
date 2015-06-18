/**
 * RSS source interface.
 * See also: http://cyber.law.harvard.edu/rss/rss.html#requiredChannelElements
 */
export interface IRss {
     rss: IRssFeed
}

export interface IRssFeed {
    version?: string | number;
    channel:  IRssChannel;
}

/**
 * RSS Channel interface.
 */
export interface IRssChannel {
     title:           string;
     link:            string;
     description:     string;
     language?:       string;
     pubDate?:        string;
     copyright?:      string;
     managingEditor?: string;
     webMaster?:      string;
     lastBuildDate?:  Date;
     category?:       string;
     generator?:      string;
     docs?:           string;
     cloud?:          string;
     ttl?:            string | number;
     image?:          string;
     rating?:         string | number;
     textInput?:      string;
     skipHours?:      string | number;
     skipDays?:       string | number;
     "dc:date"?:      Date;
     "dc:language"?:  string;
     item?:           IRssItem[];
}

/**
 * Interface for an RSS item.
 */
export interface IRssItem {
    title?:           string;
    link?:            string;
    description?:     string;
    author?:          string;
    category?:        string;
    language?:        string;
    comments?:        string;
    enclosure?:       string;
    pubDate?:         string;
    guid?:            string;
    source?:          string;
    "dc:date"?:       Date;
    "geo:lat"?:       string | number;
    "geo:long"?:      string | number;
    "content:items"?: IContentItem[];
    "media:content"?: IMediaContent[];
}

/**
 * Inferface for a content item
 */
export interface IContentItem {
    "rdf:Bag": IRdfBag;
}

export interface IRdfBag {
    "rdf:li": IRdfListItem[];
}

export interface IRdfListItem {
    "content:item": IContentItem;
}

export interface IContentItem {
    "rdf:about": string;
    "rdf:value": string;
    "content:format"?: IRdfContentFormat;
}

export interface IRdfContentFormat {
    "rdf:resource": string;
}

export interface IMediaContent {
    medium:              string;
    fileSize:            string | number;
    height:              string | number;
    type:                string;
    width:               string | number;
    url:                 string;
    "media:description": IMediaDescription;
    "media:thumbnail":   IMediaThumbnail;
}

export interface IMediaDescription {
    _:    string;
    type: string;
}

export interface IMediaThumbnail {
    url:    string;
    width:  string | number;
    height: string | number;
}
