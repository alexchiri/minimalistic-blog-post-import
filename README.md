# minimalistic-blog-post-import

The purpose of this project is to import markdown files with a specific structure into a [minimalistic-blog](https://github.com/alexchiri/minimalistic-blog) mongodb database.
In my case, the markdown files were generated using my almost-identical fork of [ghost-to-md](https://github.com/alexchiri/ghost-to-md), which extracts markdown files from the JSON file you get when exporting a [ghost.org](https://ghost.org/) blog.

## Usage

1. I would suggest to first clone this repo and then run `npm link` in the cloned folder. Afterwards you can run the `mb-post-import` from anywhere.
2. Prepare the markdown files you want to import in a folder on your disk. If you're coming from a [ghost.org](https://ghost.org/), I recommend using the [ghost-to-md](https://github.com/alexchiri/ghost-to-md) script. My fork just adds an extra post header `image`, which has the link to the cover image of the post, if any
3. Run `mb-post-import`:
```
mb-post-import ./posts-folder mongodb://user:pass@localhost:27017/blog -a "{ \"first_name\": \"First Name\", \"last_name\": \"Last Name\", \"email\": \"author@email.com\", \"twitter\": \"Twitter URL", \"linkedin\": \"LinkedIn URL" }"
```

4. It will try to parse all the .md files in the folder you mentioned and import them into the specified mongodb database. All imported blog posts will have the mentioned author details associated.