require 'rmagick'
require 'fileutils'
include Magick

module Jekyll
    class CustomImage < Liquid::Tag
        def initialize(tag_name, text, tokens)
            super
            @text = text
        end

        def render(context)
            "<img src=\"#{context[@markup.strip]}\">"
        end
    end

    class ThumbnailGenerator < Generator
        def generate(site)
            sizes = [320, 640, 1280]

            pages = Hash["drawings" => "index.html"] # "sculptures" => "sculptures.html"

            intcol = site.collections.select { |k,v| pages.has_key? k }
            intcol.each do |name, collection|
                page = site.pages.find { |pg| pg.name == pages[name] }
                file_infos = []
                # print "'", name, "'\n"
                collection.files.each do |file|
                    # print "  ", file.path, "\n"
                    tld = "assets/#{name}"
                    Dir.mkdir tld unless File.exists? tld
                    dir = "assets/#{name}/#{file.basename}"
                    Dir.mkdir dir unless File.exists? dir

                    new_files = []
                    original_filename = "original#{file.extname}"
                    original_path = "#{dir}/#{original_filename}"
                    unless File.exists? original_path
                        new_files.concat [original_filename]
                        FileUtils.cp(file.path, original_path) 
                    end

                    image = Image.read(file.path)[0]
                    file_infos.concat [FileInfo.new(original_path, image.columns, image.rows)]
                    sizes.each do |size|
                        smallerfn = "#{size}#{file.extname}"
                        outpath = "#{dir}/#{smallerfn}"
                        #puts outpath
                        unless File.exists? outpath
                            smaller = image.dup
                            smaller.resize_to_fit! size, size
                            smaller.write outpath
                            file_infos.concat [FileInfo.new(outpath, smaller.columns, smaller.rows)]
                        else
                            smaller = Image.read(outpath)[0]
                            file_infos.concat [FileInfo.new(outpath, smaller.columns, smaller.rows)]
                        end
                        new_files.concat [smallerfn]
                    end

                    reader = StaticFileReader.new(site, dir)
                    static_files = reader.read(new_files)
                    # static_files.each { |f| f.foo = "bar" }
                    site.static_files.concat(static_files)
                end
                page.data['file_data'] = file_infos
            end
        end
    end

    class FileInfo < Liquid::Drop
        attr_reader :name, :width, :height

        def initialize(name, width, height)
            @name, @width, @height = name, width, height
        end

        def to_s
            "name: #{@name}, width: #{@width}, height: #{@height}"
        end
    end

end

Liquid::Template.register_tag('image', Jekyll::CustomImage)