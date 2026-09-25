package com.aboutshane.contactapi.content;

import java.time.Duration;
import java.util.List;

import com.aboutshane.contactapi.content.SiteContent.About;
import com.aboutshane.contactapi.content.SiteContent.CharityEvent;
import com.aboutshane.contactapi.content.SiteContent.Degree;
import com.aboutshane.contactapi.content.SiteContent.Profile;
import com.aboutshane.contactapi.content.SiteContent.ResumeEntry;
import com.aboutshane.contactapi.content.SiteContent.Testimonial;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Content for each page in the site navigation. CloudFront caches these responses. */
@RestController
@RequestMapping("/api/content")
public class ContentController {
    static final CacheControl CACHE = CacheControl.maxAge(Duration.ofMinutes(5)).cachePublic();

    private final ContentRepository content;

    public ContentController(ContentRepository content) {
        this.content = content;
    }

    @GetMapping("/profile")
    public ResponseEntity<Profile> profile() {
        return cached(content.profile());
    }

    @GetMapping("/about")
    public ResponseEntity<About> about() {
        return cached(content.about());
    }

    @GetMapping("/resume")
    public ResponseEntity<List<ResumeEntry>> resume() {
        return cached(content.resume());
    }

    @GetMapping("/testimonials")
    public ResponseEntity<List<Testimonial>> testimonials() {
        return cached(content.testimonials());
    }

    @GetMapping("/education")
    public ResponseEntity<List<Degree>> education() {
        return cached(content.education());
    }

    @GetMapping("/charity")
    public ResponseEntity<List<CharityEvent>> charity() {
        return cached(content.charity());
    }

    private static <T> ResponseEntity<T> cached(T body) {
        return ResponseEntity.ok().cacheControl(CACHE).body(body);
    }
}
