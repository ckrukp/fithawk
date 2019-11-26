import { Component } from '@angular/core';
import { NavController, NavParams, ActionSheetController, ToastController, Platform, LoadingController} from 'ionic-angular';
import { GroupService } from '../../../services/group.service';
import { UserService } from '../../../services/user.service';
import { EventService } from '../../../services/event.service';
import { UserLogService } from '../../../services/user_log.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'page-event-create',
  templateUrl: 'event-create.html',
})
export class EventCreatePage {

  public event: {name: string, zip: string, description: string, tag_line: string, start_date: string, start_time: string};
  pageKind: any;
  group_id: any;
  group_name = '';

  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams, 
    public actionSheetCtrl: ActionSheetController, 
    public toastCtrl: ToastController, 
    public platform: Platform,
    public loadingCtrl: LoadingController,
    private authService: AuthService,
    private userService: UserService,
    private groupService: GroupService,
    private eventService: EventService,
    private userLogService: UserLogService,
  ) {
    this.pageKind = navParams.get('data');
    this.event = {name: '', zip: '', description: '', tag_line: '', start_date: '', start_time: ''};

    if (this.pageKind == 'create') {

      this.group_id = navParams.get('group_id');
      this.group_name = navParams.get('group_name');

    } else {

      this.event.name =  navParams.get('event').title;
      this.event.zip =  navParams.get('event').zip;
      this.event.description =  navParams.get('event').description;
      this.event.tag_line =  navParams.get('event').tagline;
      this.event.start_date =  navParams.get('event').origin_start_date;
      this.event.start_time =  navParams.get('event').origin_start_time;
      
    }
  }

  ionViewWillEnter() {
    if (this.pageKind == 'create') {
      this.event = {name: '', zip: '', description: '', tag_line: '', start_date: '', start_time: ''};
    }
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad EventCreatePage');
  }

  private presentToast(text) {
    let toast = this.toastCtrl.create({
      message: text,
      duration: 3000,
      position: 'top'
    });
    toast.present();
  }

  async createEvent () {
    const loading = this.loadingCtrl.create();
    loading.present();
    
    var memberList = await this.groupService.getGroupById(this.group_id);
    var initStatusList = [];

    memberList.users.forEach(el => {
      initStatusList.push(
        {
          user_id: el,
          rsvp_status: 0,
          report_status: 0
        }
      );
    });
    
    var saveData = {
      name: this.event.name,
      start_date: this.event.start_date,
      start_time: this.event.start_time,
      tag_line: this.event.tag_line,
      zip: this.event.zip,
      group_id: this.group_id,
      comments: [],
      members: initStatusList,
      description: this.event.description,
      photos: [],
      users: [],
      created_at: new Date().getTime(),
      user_id: this.authService.user.uid
    };


    this.eventService.addEvent(saveData).then((eventRes) => {

      this.userService.addEventToList(this.authService.user.uid, eventRes.id);
      this.groupService.addEventToList(this.group_id, eventRes.id);

      var time = parseInt(saveData.start_time.split(':')[0]);
      var time_prefix = 'am';

      if (time > 12) {
        time = time - 12;
        time_prefix = 'pm';
      }

      ;
      
      var meta = {
        name: this.group_name,
        description: 'Starting at ' + time + ':' + saveData.start_time.split(':')[1] + ' ' + time_prefix + ' at ' + this.event.name
      }

      var ids = {
        group_id: this.group_id,
        event_id: eventRes.id
      };

      this.userLogService.registerUserLog(this.authService.user.uid, ids, 4, meta, memberList.avatar);

      loading.dismiss().then(() => {
        this.presentToast("Event is created successfully.");
        
        this.navCtrl.pop();
      });
    }).catch(() => {
    });
  }

  editEvent() {
    const loading = this.loadingCtrl.create();
    
    this.eventService.updateEvent(this.navParams.get('event').event_id, this.event).then(() => {
      loading.dismiss().then(() => {
        this.navCtrl.pop();
      });
    });

    loading.present();
  }

}
